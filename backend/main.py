"""
SheepOrSleep – FastAPI Backend
"""
from __future__ import annotations
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
from pathlib import Path

from engines.behavior_engine import detect_panic_event, get_herd_score, load_model
from engines.panic_tax import simulate
from engines.nudge_engine import generate_nudges

# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="SheepOrSleep API",
    description="Panic selling & herd behavior detection for mutual fund investors",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"


def _master() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "master_data.csv", parse_dates=["date"])


def _funds() -> list[dict]:
    with open(DATA_DIR / "funds.json") as f:
        return json.load(f)


def _panic_windows() -> list[dict]:
    with open(DATA_DIR / "panic_windows.json") as f:
        return json.load(f)


# ── Startup: preload model ─────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    load_model()
    print("✅  ML model ready.")


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "SheepOrSleep API"}


# ── Funds list ─────────────────────────────────────────────────────────────
@app.get("/funds")
def get_funds():
    return _funds()


# ── NAV + Flow time-series ─────────────────────────────────────────────────
@app.get("/nav-data")
def nav_data(
    fund_id: str = Query("F001"),
    start: str   = Query("2017-01-01"),
    end: str     = Query("2024-12-31"),
):
    df = _master()
    mask = (
        (df["fund_id"] == fund_id) &
        (df["date"] >= pd.Timestamp(start)) &
        (df["date"] <= pd.Timestamp(end))
    )
    sub = df[mask].copy()
    if sub.empty:
        raise HTTPException(404, "No data found for given parameters.")

    # downsample to weekly to keep payload small
    sub = sub.set_index("date").resample("W").agg({
        "nav": "last",
        "nifty": "last",
        "net_flow": "sum",
        "vol_7d": "mean",
        "is_panic": "max",
        "nav_drop_from_peak": "min",
    }).reset_index()

    records = sub.rename(columns={"date": "date"}).to_dict(orient="records")
    for r in records:
        r["date"] = str(r["date"])[:10]
        r["nav"]  = round(r["nav"], 4)
    return {"fund_id": fund_id, "data": records}


# ── Detect behavior (single point or latest) ───────────────────────────────
@app.get("/detect-behavior")
def detect_behavior(
    fund_id: str = Query("F001"),
    date: str    = Query(None, description="YYYY-MM-DD; defaults to latest"),
):
    df = _master()
    sub = df[df["fund_id"] == fund_id].sort_values("date")
    if sub.empty:
        raise HTTPException(404, "Fund not found.")

    if date:
        row_df = sub[sub["date"] == pd.Timestamp(date)]
        if row_df.empty:
            raise HTTPException(404, "Date not found in dataset.")
        row = row_df.iloc[0].to_dict()
    else:
        row = sub.iloc[-1].to_dict()

    result = detect_panic_event(row)
    result["date"] = str(row["date"])[:10]
    result["nav"]  = round(row["nav"], 4)
    result["fund_id"] = fund_id
    return result


# ── Panic Tax simulation ───────────────────────────────────────────────────
@app.get("/panic-tax")
def panic_tax(
    fund_id: str = Query("F001"),
    start: str   = Query("2017-01-01"),
    end: str     = Query("2024-12-31"),
):
    return simulate(fund_id, start, end)


# ── Compare strategy (alias with chart series) ─────────────────────────────
@app.get("/compare-strategy")
def compare_strategy(
    fund_id: str = Query("F001"),
    start: str   = Query("2017-01-01"),
    end: str     = Query("2024-12-31"),
):
    result = simulate(fund_id, start, end)
    # downsample chart_data monthly for performance
    cdf = pd.DataFrame(result.get("chart_data", []))
    if not cdf.empty:
        cdf["date"] = pd.to_datetime(cdf["date"])
        cdf = cdf.set_index("date").resample("ME").agg({
            "nav": "last",
            "disciplined": "last",
            "panic_seller": "last",
            "is_panic": "max",
        }).reset_index()
        cdf["date"] = cdf["date"].dt.strftime("%Y-%m-%d")
        result["chart_data"] = cdf.to_dict(orient="records")
    return result


# ── Herd behavior score ────────────────────────────────────────────────────
@app.get("/herd-score")
def herd_score(
    start: str = Query("2020-02-01"),
    end: str   = Query("2020-04-30"),
):
    fund_ids = [f["id"] for f in _funds()]
    return get_herd_score(fund_ids, start, end)


# ── Nudges ─────────────────────────────────────────────────────────────────
@app.get("/nudges")
def nudges(
    fund_id: str = Query("F001"),
    date: str    = Query(None),
):
    df = _master()
    sub = df[df["fund_id"] == fund_id].sort_values("date")
    row = sub[sub["date"] == pd.Timestamp(date)].iloc[0] if date else sub.iloc[-1]
    row = row.to_dict()

    detection = detect_panic_event(row)
    severity  = detection["severity"]

    # herd score for the last 30 days
    d = pd.Timestamp(row["date"])
    h = get_herd_score(
        [f["id"] for f in _funds()],
        str((d - pd.Timedelta(days=30)).date()),
        str(d.date()),
    )

    sim = simulate(fund_id, "2017-01-01", str(d.date()))
    panic_tax_amount = sim.get("panic_tax", {}).get("amount", 0.0)

    nlist = generate_nudges(
        severity=severity,
        nav_drop_pct=row.get("nav_drop_from_peak", 0) * 100,
        herd_score=h["herd_score"],
        herd_interp=h["interpretation"],
        panic_tax_amount=panic_tax_amount,
    )
    return {
        "severity": severity,
        "panic_probability": detection.get("panic_probability", 0),
        "nudges": nlist,
    }


# ── Panic windows summary ──────────────────────────────────────────────────
@app.get("/panic-windows")
def panic_windows():
    return _panic_windows()


# ── Dashboard summary (all metrics in one call) ────────────────────────────
@app.get("/dashboard-summary")
def dashboard_summary(fund_id: str = Query("F001")):
    df = _master()
    sub = df[df["fund_id"] == fund_id].sort_values("date")
    latest = sub.iloc[-1].to_dict()

    detection = detect_panic_event(latest)

    # Quick sim (full range)
    sim = simulate(fund_id, "2017-01-01", "2024-12-31")

    herd = get_herd_score(
        [f["id"] for f in _funds()], "2024-11-01", "2024-12-31"
    )

    panic_tax_a = sim.get("panic_tax", {}).get("amount", 0)
    nudge_list  = generate_nudges(
        severity=detection["severity"],
        nav_drop_pct=latest.get("nav_drop_from_peak", 0) * 100,
        herd_score=herd["herd_score"],
        herd_interp=herd["interpretation"],
        panic_tax_amount=panic_tax_a,
    )

    return {
        "fund_id": fund_id,
        "latest_date": str(latest["date"])[:10],
        "latest_nav": round(latest["nav"], 4),
        "detection": detection,
        "panic_tax_summary": {
            "amount": panic_tax_a,
            "percentage": sim.get("panic_tax", {}).get("percentage", 0),
            "disciplined_cagr": sim.get("disciplined", {}).get("cagr", 0),
            "panic_cagr": sim.get("panic_seller", {}).get("cagr", 0),
        },
        "herd": herd,
        "nudges": nudge_list,
        "panic_events_count": len(sim.get("panic_events", [])),
    }
