"""
SheepOrSleep – FastAPI Backend v2
"""
from __future__ import annotations
from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
from pathlib import Path

from engines.behavior_engine import detect_panic_event, get_herd_score, load_model
from engines.panic_tax import simulate
from engines.nudge_engine import generate_nudges

import dotenv
dotenv.load_dotenv()

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


# ── AI Vision Analysis (Chrome Extension) ──────────────────────────────────
class VisionRequest(BaseModel):
    image_data: str # expected base64 like data:image/jpeg;base64,xxxx

@app.post("/analyze-chart")
def analyze_chart(req: VisionRequest):
    import google.generativeai as genai
    import base64
    import os

    if "base64," not in req.image_data:
        raise HTTPException(400, "Invalid image format")

    encoded_image = req.image_data.split("base64,")[1]
    image_bytes = base64.b64decode(encoded_image)

    # Store temporary file for Gemini
    temp_path = "temp_chart.jpg"
    with open(temp_path, "wb") as f:
        f.write(image_bytes)

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        vision_model = genai.GenerativeModel('gemini-2.5-flash')

        # Upload using genai
        sample_file = genai.upload_file(path=temp_path, display_name="Stock Chart")

        prompt = (
            "You are a professional technical analyst and behavioral finance expert. "
            "Analyze the candlestick chart in this image. "
            "Identify exactly what chart patterns are visible (e.g., Doji, Hammer, Head and Shoulders, Double Bottom), "
            "and suggest the likely short-term movement (predictive analysis). "
            "Finally, give one quick 'Behavioral Nudge' telling retail investors not to panic or get too greedy."
            "Keep it to bullet points and under 150 words."
        )

        response = vision_model.generate_content([sample_file, prompt])

        # cleanup
        genai.delete_file(sample_file.name)
        os.remove(temp_path)

        return {"analysis": response.text}
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(500, f"Vision AI error: {str(e)}")

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

# ── Time Machine API ────────────────────────────────────────────────────────
@app.get("/time-machine")
def time_machine(fund_id: str, date: str, amount: float):
    from engines.behavior_engine import get_master_data
    df = get_master_data()
    fund_df = df[df['fund_id'] == fund_id].sort_values('date').set_index('date')

    if fund_df.empty:
        raise HTTPException(status_code=404, detail="Fund not found")

    try:
        # Find closest date
        target_date = pd.to_datetime(date)
        closest_date = fund_df.index[fund_df.index >= target_date][0]
        start_nav = fund_df.loc[closest_date, 'nav']

        # Get latest
        latest_date = fund_df.index[-1]
        latest_nav = fund_df.loc[latest_date, 'nav']

        units = amount / start_nav
        current_value = units * latest_nav

        years = max(0.1, (latest_date - closest_date).days / 365.25)
        cagr = ((current_value / amount) ** (1/years)) - 1
        abs_return = ((current_value - amount) / amount) * 100

        return {
            "start_date": closest_date.strftime("%Y-%m-%d"),
            "end_date": latest_date.strftime("%Y-%m-%d"),
            "start_nav": round(start_nav, 2),
            "latest_nav": round(latest_nav, 2),
            "invested": round(amount, 2),
            "current": round(current_value, 2),
            "abs_return": round(abs_return, 2),
            "cagr": round(cagr * 100, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Portfolio Upload ─────────────────────────────────────────────────────────
@app.post("/upload-portfolio")
async def upload_portfolio(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    from engines.portfolio_engine import evaluate_portfolio
    try:
        res = evaluate_portfolio(content)
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
