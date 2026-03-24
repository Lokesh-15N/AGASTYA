"""
Real Mutual Fund NAV Data Fetcher – Extended
────────────────────────────────────────────
Fetches data from inception to today for 10 popular Indian mutual funds
across all categories using the free mfapi.in API (no key required).
"""
import os, json, time, requests
import pandas as pd
import numpy as np
from pathlib import Path

OUT_DIR = Path(__file__).parent

# ── 10 funds across all categories (AMFI scheme codes from mfapi.in) ─────
REAL_FUNDS = [
    # Large Cap
    (118989, "R001", "Mirae Asset Large Cap – Direct",          "Large Cap"),
    (119598, "R002", "SBI Blue Chip Fund – Direct",             "Large Cap"),
    (120586, "R003", "ICICI Pru Bluechip – Direct",             "Large Cap"),
    # Mid Cap
    (120505, "R004", "Axis Midcap – Direct",                    "Mid Cap"),
    (118562, "R005", "HDFC Mid-Cap Opportunities – Direct",     "Mid Cap"),
    # Small Cap
    (118778, "R006", "Nippon India Small Cap – Direct",         "Small Cap"),
    (125494, "R007", "SBI Small Cap – Direct",                  "Small Cap"),
    # Flexi / Multi Cap
    (122639, "R008", "Parag Parikh Flexi Cap – Direct",         "Flexi Cap"),
    # ELSS
    (119109, "R009", "HDFC ELSS Tax Saver – Direct",            "ELSS"),
    # Index
    (120716, "R010", "UTI Nifty 50 Index – Direct",             "Index"),
]

BASE_URL = "https://api.mfapi.in/mf/{code}"

PANIC_LABELS = [
    ("2008-01-01", "2009-03-31"),   # Global Financial Crisis
    ("2011-08-01", "2011-12-31"),   # Euro debt crisis
    ("2015-08-01", "2016-02-29"),   # China slowdown + commodity crash
    ("2018-09-01", "2018-12-31"),   # IL&FS / NBFC crisis
    ("2020-02-20", "2020-04-30"),   # COVID-19 crash
    ("2022-01-01", "2022-07-31"),   # Russia-Ukraine + rate hike bear
]


def fetch_nav(scheme_code: int) -> pd.DataFrame:
    url = BASE_URL.format(code=scheme_code)
    print(f"  → {url} … ", end="", flush=True)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    rows = resp.json().get("data", [])
    print(f"{len(rows)} rows")
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y")
    df["nav"]  = pd.to_numeric(df["nav"], errors="coerce")
    return df.dropna().sort_values("date").reset_index(drop=True)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    s = df["nav"]
    ret     = s.pct_change().fillna(0)
    vol7    = ret.rolling(7, min_periods=1).std().fillna(0)
    vol30   = ret.rolling(30, min_periods=1).std().fillna(0)
    ma7     = s.rolling(7, min_periods=1).mean()
    ma30    = s.rolling(30, min_periods=1).mean()
    peak30  = s.rolling(30, min_periods=1).max()
    nav_drop= (s - peak30) / peak30
    # Proxy net_flow: negative spike on large drops
    n = len(df)
    base  = np.random.normal(60, 18, n)
    extra = np.where(ret.values < -0.02, np.random.normal(-150, 40, n), 0)
    flow  = base + extra

    df = df.copy()
    df["daily_return"]       = ret.round(6)
    df["vol_7d"]             = vol7.round(6)
    df["vol_30d"]            = vol30.round(6)
    df["ma_7d"]              = ma7.round(4)
    df["ma_30d"]             = ma30.round(4)
    df["net_flow"]           = flow.round(2)
    df["flow_ma7"]           = pd.Series(flow).rolling(7, min_periods=1).mean().round(2).values
    df["nav_drop_from_peak"] = nav_drop.round(6)
    df["nifty"]              = 0.0
    df["is_panic"]           = 0
    return df


def label_panic(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for start, end in PANIC_LABELS:
        mask = (df["date"] >= pd.Timestamp(start)) & (df["date"] <= pd.Timestamp(end))
        df.loc[mask, "is_panic"] = 1
    return df


def main():
    np.random.seed(42)
    all_frames, fund_meta = [], []

    for code, fid, name, cat in REAL_FUNDS:
        print(f"\n▶ {name}")
        try:
            nav_df = fetch_nav(code)
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            continue

        nav_df = build_features(nav_df)
        nav_df = label_panic(nav_df)
        nav_df["fund_id"]   = fid
        nav_df["fund_name"] = name
        nav_df["category"]  = cat

        cols = [
            "date","fund_id","fund_name","category","nav","nifty",
            "net_flow","daily_return","vol_7d","vol_30d","ma_7d","ma_30d",
            "flow_ma7","nav_drop_from_peak","is_panic",
        ]
        all_frames.append(nav_df[cols])
        fund_meta.append({"id": fid, "name": name, "category": cat, "beta": 1.0})
        time.sleep(0.6)

    if not all_frames:
        print("\n✗  No data fetched.")
        return

    combined = pd.concat(all_frames, ignore_index=True)
    combined["date"] = combined["date"].dt.strftime("%Y-%m-%d")
    combined.to_csv(OUT_DIR / "master_data.csv", index=False)

    with open(OUT_DIR / "funds.json", "w") as f:
        json.dump(fund_meta, f, indent=2)

    print(f"\n✅  {len(combined):,} rows | {combined['fund_id'].nunique()} funds")
    print(f"    Panic rows : {combined['is_panic'].sum():,}")
    print(f"    Date range : {combined['date'].min()} → {combined['date'].max()}")
    print("\nRestart backend: python -m uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
