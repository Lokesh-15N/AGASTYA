"""
SheepOrSleep – FastAPI Backend v2
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
    version="2.0.0",
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
    pw_path = DATA_DIR / "panic_windows.json"
    if pw_path.exists():
        with open(pw_path) as f:
            return json.load(f)
    return []

def _date_range(fund_id: str) -> tuple[str, str]:
    """Return start/end dates available for a fund."""
    df  = _master()
    sub = df[df["fund_id"] == fund_id]["date"]
    if sub.empty:
        return "2017-01-01", "2024-12-31"
    return str(sub.min().date()), str(sub.max().date())


# ── Startup: preload model ─────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    load_model()
    print("✅  ML model ready.")


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "SheepOrSleep API v2"}


# ── Funds list ─────────────────────────────────────────────────────────────
@app.get("/funds")
def get_funds():
    return _funds()


# ── NAV + Flow time-series ─────────────────────────────────────────────────
@app.get("/nav-data")
def nav_data(
    fund_id: str = Query("R001"),
    start: str   = Query(None),
    end: str     = Query(None),
):
    df = _master()
    s, e = _date_range(fund_id)
    start = start or s
    end   = end   or e
    mask  = (
        (df["fund_id"] == fund_id) &
        (df["date"] >= pd.Timestamp(start)) &
        (df["date"] <= pd.Timestamp(end))
    )
    sub = df[mask].copy()
    if sub.empty:
        raise HTTPException(404, "No data found for given parameters.")

    sub = sub.set_index("date").resample("W").agg({
        "nav": "last", "nifty": "last", "net_flow": "sum",
        "vol_7d": "mean", "is_panic": "max", "nav_drop_from_peak": "min",
    }).reset_index()

    records = sub.to_dict(orient="records")
    for r in records:
        r["date"] = str(r["date"])[:10]
        r["nav"]  = round(r["nav"], 4)
    return {"fund_id": fund_id, "data": records}


# ── Detect behavior ────────────────────────────────────────────────────────
@app.get("/detect-behavior")
def detect_behavior(
    fund_id: str = Query("R001"),
    date: str    = Query(None),
):
    df  = _master()
    sub = df[df["fund_id"] == fund_id].sort_values("date")
    if sub.empty:
        raise HTTPException(404, "Fund not found.")
    row = (sub[sub["date"] == pd.Timestamp(date)].iloc[0]
           if date else sub.iloc[-1]).to_dict()
    result = detect_panic_event(row)
    result["date"]    = str(row["date"])[:10]
    result["nav"]     = round(row["nav"], 4)
    result["fund_id"] = fund_id
    return result


# ── Panic Tax simulation ───────────────────────────────────────────────────
@app.get("/panic-tax")
def panic_tax(
    fund_id: str = Query("R001"),
    start: str   = Query(None),
    end: str     = Query(None),
):
    s, e = _date_range(fund_id)
    return simulate(fund_id, start or s, end or e)


# ── Compare strategy ──────────────────────────────────────────────────────
@app.get("/compare-strategy")
def compare_strategy(
    fund_id: str = Query("R001"),
    start: str   = Query(None),
    end: str     = Query(None),
):
    s, e   = _date_range(fund_id)
    result = simulate(fund_id, start or s, end or e)

    cdf = pd.DataFrame(result.get("chart_data", []))
    if not cdf.empty:
        cdf["date"] = pd.to_datetime(cdf["date"])
        cdf = cdf.set_index("date").resample("ME").agg({
            "nav":           "last",
            "disciplined":   "last",
            "panic_seller":  "last",
            "smart_investor":"last",
            "is_panic":      "max",
        }).reset_index()
        cdf["date"] = cdf["date"].dt.strftime("%Y-%m-%d")
        result["chart_data"] = cdf.to_dict(orient="records")
    return result


# ── Herd behavior score ───────────────────────────────────────────────────
@app.get("/herd-score")
def herd_score(
    start: str = Query("2020-02-01"),
    end: str   = Query("2020-04-30"),
):
    fund_ids = [f["id"] for f in _funds()]
    return get_herd_score(fund_ids, start, end)


# ── Nudges ────────────────────────────────────────────────────────────────
@app.get("/nudges")
def nudges(
    fund_id: str = Query("R001"),
    date: str    = Query(None),
):
    df  = _master()
    sub = df[df["fund_id"] == fund_id].sort_values("date")
    row = (sub[sub["date"] == pd.Timestamp(date)].iloc[0]
           if date else sub.iloc[-1]).to_dict()

    detection = detect_panic_event(row)
    d = pd.Timestamp(row["date"])
    h = get_herd_score(
        [f["id"] for f in _funds()],
        str((d - pd.Timedelta(days=30)).date()),
        str(d.date()),
    )
    s, e = _date_range(fund_id)
    sim  = simulate(fund_id, s, str(d.date()))
    nlist = generate_nudges(
        severity=detection["severity"],
        nav_drop_pct=row.get("nav_drop_from_peak", 0) * 100,
        herd_score=h["herd_score"],
        herd_interp=h["interpretation"],
        panic_tax_amount=sim.get("panic_tax", {}).get("amount", 0.0),
    )
    return {
        "severity":         detection["severity"],
        "panic_probability":detection.get("panic_probability", 0),
        "nudges":           nlist,
    }


# ── Panic windows ─────────────────────────────────────────────────────────
@app.get("/panic-windows")
def panic_windows_ep():
    return _panic_windows()


# ── Dashboard summary ─────────────────────────────────────────────────────
@app.get("/dashboard-summary")
def dashboard_summary(fund_id: str = Query("R001")):
    df     = _master()
    sub    = df[df["fund_id"] == fund_id].sort_values("date")
    latest = sub.iloc[-1].to_dict()
    detection = detect_panic_event(latest)

    s, e = _date_range(fund_id)
    sim  = simulate(fund_id, s, e)

    herd = get_herd_score([f["id"] for f in _funds()],
                          str((sub["date"].max() - pd.Timedelta(days=60)).date()),
                          str(sub["date"].max().date()))

    pt = sim.get("panic_tax", {}).get("amount", 0)
    nudge_list = generate_nudges(
        severity=detection["severity"],
        nav_drop_pct=latest.get("nav_drop_from_peak", 0) * 100,
        herd_score=herd["herd_score"],
        herd_interp=herd["interpretation"],
        panic_tax_amount=pt,
    )
    return {
        "fund_id":     fund_id,
        "latest_date": str(latest["date"])[:10],
        "latest_nav":  round(latest["nav"], 4),
        "detection":   detection,
        "panic_tax_summary": {
            "amount":           pt,
            "percentage":       sim.get("panic_tax", {}).get("percentage", 0),
            "disciplined_cagr": sim.get("disciplined", {}).get("cagr", 0),
            "panic_cagr":       sim.get("panic_seller", {}).get("cagr", 0),
            "smart_cagr":       sim.get("smart_investor", {}).get("cagr", 0),
        },
        "herd":               herd,
        "nudges":             nudge_list,
        "panic_events_count": len(sim.get("panic_events", [])),
    }


# ── AI Chatbot ────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str    # "user" or "model"
    parts: str   # plain text

class ChatRequest(BaseModel):
    history: list[ChatMessage] = []
    message: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    try:
        from engines.chatbot import chat, STARTER_QUESTIONS
        history = [{"role": m.role, "parts": m.parts} for m in req.history]
        reply   = chat(history, req.message)
        return {"reply": reply, "starter_questions": STARTER_QUESTIONS}
    except Exception as e:
        raise HTTPException(500, f"Chatbot error: {str(e)}")

@app.get("/chat/starters")
def chat_starters():
    from engines.chatbot import STARTER_QUESTIONS
    return {"questions": STARTER_QUESTIONS}
