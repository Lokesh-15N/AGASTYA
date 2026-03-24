"""
Synthetic data generator for SheepOrSleep.
Simulates NAV, investor flows, and NIFTY 50 for 2017-2024
with realistic panic events (2018 NBFC crisis, 2020 COVID crash, 2022 bear market).
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json, os

np.random.seed(42)

# ── date range ─────────────────────────────────────────────────────────────
START = datetime(2017, 1, 2)
END   = datetime(2024, 12, 31)
dates = pd.bdate_range(start=START, end=END)          # business days only
N = len(dates)

# ── Panic windows (start_idx, end_idx, severity 0-1) ──────────────────────
def date_to_idx(d: str) -> int:
    dt = pd.Timestamp(d)
    idx = np.searchsorted(dates, dt)
    return int(min(idx, N - 1))

PANIC_WINDOWS = [
    # 2018 NBFC / IL&FS crisis
    {"name": "IL&FS / NBFC Crisis", "start": "2018-09-20", "end": "2018-11-30", "severity": 0.65},
    # 2020 COVID crash
    {"name": "COVID-19 Crash",       "start": "2020-02-24", "end": "2020-03-31", "severity": 0.92},
    # 2022 Russia-Ukraine / rate hike bear market
    {"name": "Global Rate-Hike Bear", "start": "2022-01-17", "end": "2022-06-30", "severity": 0.70},
]
for pw in PANIC_WINDOWS:
    pw["si"] = date_to_idx(pw["start"])
    pw["ei"] = date_to_idx(pw["end"])

# ── Build NIFTY 50 index simulation ───────────────────────────────────────
base_nifty = 10000.0
nifty_ret  = np.random.normal(0.0004, 0.0095, N)    # daily ~10% annual

# inject crashes into NIFTY
for pw in PANIC_WINDOWS:
    si, ei = pw["si"], pw["ei"]
    crash_len = ei - si + 1
    nifty_ret[si:ei+1] = np.random.normal(-0.012 * pw["severity"],
                                           0.015,
                                           crash_len)
    # recovery slope
    rec = min(ei + crash_len, N)
    nifty_ret[ei+1:rec] = np.random.normal(0.002, 0.008, rec - ei - 1)

nifty = base_nifty * np.exp(np.cumsum(nifty_ret))

# ── Build NAV for 3 fund categories ───────────────────────────────────────
FUNDS = [
    {"id": "F001", "name": "BlueChip Growth Fund",    "category": "Large Cap",   "beta": 0.95},
    {"id": "F002", "name": "Multicap Momentum Fund",  "category": "Multi Cap",   "beta": 1.15},
    {"id": "F003", "name": "Mid & Small Cap Booster", "category": "Mid-Small Cap","beta": 1.35},
]

def build_nav(beta: float, base: float = 100.0) -> np.ndarray:
    fund_ret = nifty_ret * beta + np.random.normal(0.00008, 0.003, N)
    return base * np.exp(np.cumsum(fund_ret))

for f in FUNDS:
    f["nav"] = build_nav(f["beta"])

# ── Build investor flows ───────────────────────────────────────────────────
def build_flows(beta: float) -> np.ndarray:
    """
    Normal baseline flow ~₹50 Cr/day
    Panic: large outflows proportional to NAV drop
    """
    base_flow = np.random.normal(50, 15, N)          # crores
    flows = base_flow.copy()
    for pw in PANIC_WINDOWS:
        si, ei = pw["si"], pw["ei"]
        plen = ei - si + 1
        # spike of outflows
        panic_flow = np.random.normal(-120 * pw["severity"] * beta,
                                       20,
                                       plen)
        flows[si:ei+1] += panic_flow
    return flows

for f in FUNDS:
    f["flows"] = build_flows(f["beta"])

# ── Volatility & rolling features ─────────────────────────────────────────
def enrich(nav: np.ndarray, flows: np.ndarray):
    s = pd.Series(nav)
    ret = s.pct_change().fillna(0)
    vol7  = ret.rolling(7).std().fillna(0)
    vol30 = ret.rolling(30).std().fillna(0)
    ma7   = s.rolling(7).mean().bfill()
    ma30  = s.rolling(30).mean().bfill()
    fo    = pd.Series(flows)
    fo_ma7 = fo.rolling(7).mean().bfill()
    nav_drop = (s - s.rolling(30).max().bfill()) / s.rolling(30).max().bfill()
    return ret.values, vol7.values, vol30.values, ma7.values, ma30.values, \
           fo_ma7.values, nav_drop.values

# ── Panic label (ground truth) ─────────────────────────────────────────────
panic_label = np.zeros(N, dtype=int)
for pw in PANIC_WINDOWS:
    panic_label[pw["si"]:pw["ei"]+1] = 1

# ── Assemble master dataframe ──────────────────────────────────────────────
records = []
for f in FUNDS:
    rets, v7, v30, ma7, ma30, fo_ma7, nav_drop = enrich(f["nav"], f["flows"])
    for i in range(N):
        records.append({
            "date":       dates[i].strftime("%Y-%m-%d"),
            "fund_id":    f["id"],
            "fund_name":  f["name"],
            "category":   f["category"],
            "nav":        round(float(f["nav"][i]), 4),
            "nifty":      round(float(nifty[i]), 2),
            "net_flow":   round(float(f["flows"][i]), 2),
            "daily_return": round(float(rets[i]), 6),
            "vol_7d":     round(float(v7[i]), 6),
            "vol_30d":    round(float(v30[i]), 6),
            "ma_7d":      round(float(ma7[i]), 4),
            "ma_30d":     round(float(ma30[i]), 4),
            "flow_ma7":   round(float(fo_ma7[i]), 2),
            "nav_drop_from_peak": round(float(nav_drop[i]), 6),
            "is_panic":   int(panic_label[i]),
        })

df = pd.DataFrame(records)

# ── Save ──────────────────────────────────────────────────────────────────
out_dir = os.path.dirname(__file__)
df.to_csv(os.path.join(out_dir, "master_data.csv"), index=False)

# Fund metadata JSON
fund_meta = [{k: f[k] for k in ("id","name","category","beta")} for f in FUNDS]
with open(os.path.join(out_dir, "funds.json"), "w") as fh:
    json.dump(fund_meta, fh, indent=2)

# Panic windows JSON
pw_export = [{k: v for k, v in pw.items() if k not in ("si","ei","nav","flows")}
             for pw in PANIC_WINDOWS]
with open(os.path.join(out_dir, "panic_windows.json"), "w") as fh:
    json.dump(pw_export, fh, indent=2)

print(f"✅  Generated {len(df):,} rows across {len(FUNDS)} funds.")
print(f"    Panic rows : {panic_label.sum():,} / {N}")
print(f"    Saved to   : {out_dir}")
