"""
Panic Tax Calculation Engine – v2
───────────────────────────────────
Three investor strategies simulated on the same fund:

  A – Disciplined SIP investor   → Invests every month, never exits.
  B – Panic Seller               → Cracks at the NAV trough of each crisis,
                                   re-enters 60 business days after it ends.
  C – Smart (Contrarian) Investor→ Does SIP like A, PLUS doubles the SIP
                                   during every panic month (buys the dip).
                                   Never exits.

Panic Tax  = A.final - B.final  (cost of panic)
Smart Edge = C.final - A.final  (reward for being contrarian)
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR      = Path(__file__).parent.parent / "data"
SIP_AMOUNT    = 10_000   # ₹ per month
REENTRY_DELAY = 60       # business days after panic window ends
SMART_EXTRA   = 2.0      # Smart investor adds 2× SIP during panic months


def _load_nav(fund_id: str) -> pd.DataFrame:
    path = DATA_DIR / "master_data.csv"
    df   = pd.read_csv(path, parse_dates=["date"])
    return (df[df["fund_id"] == fund_id]
            [["date","nav","is_panic","net_flow","nav_drop_from_peak"]]
            .sort_values("date").reset_index(drop=True))


def _cagr(invested: float, end_val: float, years: float) -> float:
    if invested <= 0 or end_val <= 0 or years <= 0:
        return 0.0
    return round((end_val / invested) ** (1 / years) - 1, 6)


def _panic_windows(panic_arr: np.ndarray):
    windows, in_ev, start = [], False, 0
    for i, p in enumerate(panic_arr):
        if p == 1 and not in_ev:
            in_ev, start = True, i
        elif p == 0 and in_ev:
            windows.append((start, i - 1))
            in_ev = False
    if in_ev:
        windows.append((start, len(panic_arr) - 1))
    return windows


def simulate(fund_id: str, start: str, end: str) -> dict:
    df = _load_nav(fund_id)
    mask = (df["date"] >= pd.Timestamp(start)) & (df["date"] <= pd.Timestamp(end))
    df   = df[mask].reset_index(drop=True)
    if len(df) < 20:
        return {"error": "Not enough data for the selected period."}

    n         = len(df)
    nav_arr   = df["nav"].values
    panic_arr = df["is_panic"].values

    # ── SIP days (first day of each month present) ──────────────────────
    sip_days, invested_month = set(), None
    for i in range(n):
        d = df["date"].iloc[i]
        if invested_month != (d.year, d.month):
            sip_days.add(i)
            invested_month = (d.year, d.month)

    # ── Panic windows & sell/re-entry schedule for Strategy B ───────────
    pw         = _panic_windows(panic_arr)
    sell_at    = {}   # B sells at trough of each window
    reentry_at = {}   # B re-enters 60 days after window end

    panic_months = set()  # calendar months that have any panic day
    for ws, we in pw:
        t = ws + int(np.argmin(nav_arr[ws:we + 1]))
        sell_at[t] = True
        reentry_at[min(we + REENTRY_DELAY, n - 1)] = True
        for i in range(ws, we + 1):
            d = df["date"].iloc[i]
            panic_months.add((d.year, d.month))

    # ── Strategy A: Disciplined SIP ─────────────────────────────────────
    uA, tA, pA = 0.0, 0.0, np.zeros(n)
    for i in range(n):
        if i in sip_days:
            uA += SIP_AMOUNT / nav_arr[i]
            tA += SIP_AMOUNT
        pA[i] = uA * nav_arr[i]

    # ── Strategy B: Panic Seller ─────────────────────────────────────────
    uB, cB, tB, in_cash = 0.0, 0.0, 0.0, False
    pB = np.zeros(n)
    for i in range(n):
        if i in sip_days:
            if not in_cash:
                uB += SIP_AMOUNT / nav_arr[i]; tB += SIP_AMOUNT
            else:
                cB += SIP_AMOUNT; tB += SIP_AMOUNT
        if i in sell_at and uB > 0 and not in_cash:
            cB += uB * nav_arr[i]; uB = 0.0; in_cash = True
        if in_cash and i in reentry_at:
            if cB > 0:
                uB += cB / nav_arr[i]; cB = 0.0
            in_cash = False
        pB[i] = uB * nav_arr[i] + cB

    # ── Strategy C: Smart Contrarian (buys extra during panic) ───────────
    uC, tC, pC = 0.0, 0.0, np.zeros(n)
    for i in range(n):
        if i in sip_days:
            d = df["date"].iloc[i]
            extra = SMART_EXTRA if (d.year, d.month) in panic_months else 0.0
            amt   = SIP_AMOUNT * (1 + extra)
            uC   += amt / nav_arr[i]
            tC   += amt
        pC[i] = uC * nav_arr[i]

    # ── Metrics ──────────────────────────────────────────────────────────
    years  = (df["date"].iloc[-1] - df["date"].iloc[0]).days / 365.25
    fA, fB, fC = float(pA[-1]), float(pB[-1]), float(pC[-1])

    panic_tax  = fA - fB
    smart_edge = fC - fA

    # ── Chart time-series ─────────────────────────────────────────────────
    chart_data = [
        {
            "date":          df["date"].iloc[i].strftime("%Y-%m-%d"),
            "nav":           round(float(nav_arr[i]), 4),
            "disciplined":   round(float(pA[i]), 2),
            "panic_seller":  round(float(pB[i]), 2),
            "smart_investor":round(float(pC[i]), 2),
            "is_panic":      int(panic_arr[i]),
        }
        for i in range(n)
    ]

    # ── Panic event list with sell NAV ────────────────────────────────────
    panic_events = []
    for ws, we in pw:
        t         = ws + int(np.argmin(nav_arr[ws:we + 1]))
        start_nav = float(nav_arr[ws])
        trough    = float(nav_arr[t])
        drop_pct  = round((trough - start_nav) / start_nav * 100, 2)
        panic_events.append({
            "start":        df["date"].iloc[ws].strftime("%Y-%m-%d"),
            "end":          df["date"].iloc[we].strftime("%Y-%m-%d"),
            "nav_drop_pct": drop_pct,
            "sell_at_nav":  round(trough, 2),
        })

    def gs(invested, fv):
        if invested > 0:
            return round((fv - invested) / invested * 100, 2)
        return 0.0

    return {
        "fund_id":       fund_id,
        "period":        {"start": str(df["date"].iloc[0].date()),
                          "end":   str(df["date"].iloc[-1].date())},
        "total_invested":round(tA, 2),
        "disciplined": {
            "final_value":   round(fA, 2),
            "cagr":          _cagr(tA, fA, years),
            "absolute_gain": round(fA - tA, 2),
            "gain_pct":      gs(tA, fA),
        },
        "panic_seller": {
            "final_value":   round(fB, 2),
            "cagr":          _cagr(tB, fB, years),
            "absolute_gain": round(fB - tB, 2),
            "gain_pct":      gs(tB, fB),
        },
        "smart_investor": {
            "final_value":    round(fC, 2),
            "total_invested": round(tC, 2),
            "cagr":           _cagr(tC, fC, years),
            "absolute_gain":  round(fC - tC, 2),
            "gain_pct":       gs(tC, fC),
            "smart_edge_vs_disciplined": round(smart_edge, 2),
        },
        "panic_tax": {
            "amount":     round(panic_tax, 2),
            "percentage": round(panic_tax / tA * 100 if tA > 0 else 0, 2),
        },
        "smart_edge": {
            "amount":     round(smart_edge, 2),
            "percentage": round(smart_edge / tA * 100 if tA > 0 else 0, 2),
        },
        "years":        round(years, 2),
        "panic_events": panic_events,
        "chart_data":   chart_data,
    }
