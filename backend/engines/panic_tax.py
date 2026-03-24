"""
Panic Tax Calculation Engine
─────────────────────────────
Simulates two investor strategies on a given fund and time range:

  Strategy A – Disciplined SIP investor
    → Invests ₹SIP_AMOUNT every month; never exits.

  Strategy B – Panic Seller
    → Same SIP, but liquidates entirely on detected panic events
      and re-enters 60 days later.

Outputs:
  - Final portfolio values for both
  - Panic Tax = A.final_value - B.final_value
  - CAGR for both
  - Full time-series for charting
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SIP_AMOUNT = 10_000       # ₹ per month
REENTRY_DELAY = 60        # business days


def _load_nav(fund_id: str) -> pd.DataFrame:
    path = DATA_DIR / "master_data.csv"
    df = pd.read_csv(path, parse_dates=["date"])
    return df[df["fund_id"] == fund_id][["date", "nav", "is_panic", "net_flow",
                                          "nav_drop_from_peak"]].sort_values("date").reset_index(drop=True)


def _cagr(start_val: float, end_val: float, years: float) -> float:
    if start_val <= 0 or years <= 0:
        return 0.0
    return round((end_val / start_val) ** (1 / years) - 1, 6)


def simulate(fund_id: str, start: str, end: str) -> dict:
    df = _load_nav(fund_id)
    mask = (df["date"] >= pd.Timestamp(start)) & (df["date"] <= pd.Timestamp(end))
    df = df[mask].reset_index(drop=True)

    if len(df) < 20:
        return {"error": "Not enough data for the selected period."}

    n = len(df)
    nav_arr = df["nav"].values
    panic_arr = df["is_panic"].values

    # ── Strategy A: Disciplined SIP ─────────────────────────────────────
    units_A = 0.0
    total_invested_A = 0.0
    portfolio_A = np.zeros(n)

    sip_days = set()
    cur = df["date"].iloc[0]
    invested_month = None
    for i, row in df.iterrows():
        d = row["date"]
        if invested_month != (d.year, d.month):
            sip_days.add(i)
            invested_month = (d.year, d.month)

    for i in range(n):
        if i in sip_days:
            units_bought = SIP_AMOUNT / nav_arr[i]
            units_A += units_bought
            total_invested_A += SIP_AMOUNT
        portfolio_A[i] = units_A * nav_arr[i]

    # ── Strategy B: Panic Seller ─────────────────────────────────────────
    units_B = 0.0
    cash_B  = 0.0
    total_invested_B = 0.0
    portfolio_B = np.zeros(n)
    in_cash = False
    reentry_idx = -1

    for i in range(n):
        # SIP day: invest if not in cash (panic mode)
        if i in sip_days:
            if not in_cash:
                units_bought = SIP_AMOUNT / nav_arr[i]
                units_B += units_bought
                total_invested_B += SIP_AMOUNT
            else:
                # SIP amount accumulates as cash
                cash_B += SIP_AMOUNT
                total_invested_B += SIP_AMOUNT

        # panic trigger: sell all units
        if not in_cash and panic_arr[i] == 1 and units_B > 0:
            cash_B += units_B * nav_arr[i]
            units_B = 0.0
            in_cash = True
            reentry_idx = min(i + REENTRY_DELAY, n - 1)

        # re-entry after delay
        if in_cash and i == reentry_idx:
            units_bought = cash_B / nav_arr[i]
            units_B += units_bought
            cash_B = 0.0
            in_cash = False
            reentry_idx = -1

        portfolio_B[i] = units_B * nav_arr[i] + cash_B

    # ── Final metrics ────────────────────────────────────────────────────
    years = (df["date"].iloc[-1] - df["date"].iloc[0]).days / 365.25
    final_A = float(portfolio_A[-1])
    final_B = float(portfolio_B[-1])
    panic_tax = final_A - final_B
    panic_tax_pct = (panic_tax / total_invested_A * 100) if total_invested_A > 0 else 0.0

    # ── Time-series for charts ────────────────────────────────────────────
    chart_data = []
    for i in range(n):
        chart_data.append({
            "date":        df["date"].iloc[i].strftime("%Y-%m-%d"),
            "nav":         round(float(nav_arr[i]), 4),
            "disciplined": round(float(portfolio_A[i]), 2),
            "panic_seller":round(float(portfolio_B[i]), 2),
            "is_panic":    int(panic_arr[i]),
        })

    # ── Panic event summary ───────────────────────────────────────────────
    panic_events = []
    in_event = False
    ev_start = None
    for i in range(n):
        if panic_arr[i] == 1 and not in_event:
            in_event = True
            ev_start = i
        elif panic_arr[i] == 0 and in_event:
            ev_start_nav = float(nav_arr[ev_start])
            ev_end_nav   = float(nav_arr[i - 1])
            panic_events.append({
                "start": df["date"].iloc[ev_start].strftime("%Y-%m-%d"),
                "end":   df["date"].iloc[i - 1].strftime("%Y-%m-%d"),
                "nav_drop_pct": round((ev_end_nav - ev_start_nav) / ev_start_nav * 100, 2),
            })
            in_event = False

    return {
        "fund_id": fund_id,
        "period": {"start": str(df["date"].iloc[0].date()), "end": str(df["date"].iloc[-1].date())},
        "total_invested": round(total_invested_A, 2),
        "disciplined": {
            "final_value": round(final_A, 2),
            "cagr": _cagr(total_invested_A, final_A, years),
            "absolute_gain": round(final_A - total_invested_A, 2),
            "gain_pct": round((final_A - total_invested_A) / total_invested_A * 100, 2),
        },
        "panic_seller": {
            "final_value": round(final_B, 2),
            "cagr": _cagr(total_invested_B, final_B, years),
            "absolute_gain": round(final_B - total_invested_B, 2),
            "gain_pct": round((final_B - total_invested_B) / total_invested_B * 100, 2),
        },
        "panic_tax": {
            "amount": round(panic_tax, 2),
            "percentage": round(panic_tax_pct, 2),
        },
        "years": round(years, 2),
        "panic_events": panic_events,
        "chart_data": chart_data,
    }
