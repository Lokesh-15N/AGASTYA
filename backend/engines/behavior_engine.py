"""
Behavioral Bias Detection Engine
─────────────────────────────────
Two layers:
  1. Rule-based : fast, interpretable
  2. ML model   : RandomForest trained on the synthetic dataset

Exposed:
  detect_panic_event(row_dict)  → dict
  get_herd_score(fund_id, date_range) → float
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib, os, json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_PATH = Path(__file__).parent / "panic_model.pkl"

FEATURES = [
    "daily_return", "vol_7d", "vol_30d",
    "nav_drop_from_peak", "net_flow", "flow_ma7",
]

# ── Thresholds (rule-based) ────────────────────────────────────────────────
RULES = {
    "nav_drop_threshold":    -0.03,    # NAV dropped >3 % from 30d peak
    "flow_spike_threshold":  -50.0,    # net outflow > ₹50 Cr
    "volatility_threshold":   0.015,   # 7d vol > 1.5%
}


def _load_data() -> pd.DataFrame:
    path = DATA_DIR / "master_data.csv"
    if not path.exists():
        raise FileNotFoundError("master_data.csv not found. Run generate_data.py first.")
    return pd.read_csv(path, parse_dates=["date"])


# ── Train / load ML model ──────────────────────────────────────────────────
def train_model(df: pd.DataFrame | None = None) -> Pipeline:
    if df is None:
        df = _load_data()

    X = df[FEATURES].fillna(0).values
    y = df["is_panic"].values

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])
    pipe.fit(X, y)
    joblib.dump(pipe, MODEL_PATH)
    return pipe


def load_model() -> Pipeline:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    df = _load_data()
    return train_model(df)


# ── Rule-based detection ───────────────────────────────────────────────────
def rule_based_detect(row: dict) -> dict:
    signals = []

    if row.get("nav_drop_from_peak", 0) < RULES["nav_drop_threshold"]:
        signals.append({
            "signal": "nav_drop",
            "value": row["nav_drop_from_peak"],
            "message": f"NAV dropped {abs(row['nav_drop_from_peak'])*100:.1f}% from 30-day peak",
        })

    if row.get("net_flow", 0) < RULES["flow_spike_threshold"]:
        signals.append({
            "signal": "flow_spike",
            "value": row["net_flow"],
            "message": f"Net outflow spike: ₹{abs(row['net_flow']):.1f} Cr",
        })

    if row.get("vol_7d", 0) > RULES["volatility_threshold"]:
        signals.append({
            "signal": "high_volatility",
            "value": row["vol_7d"],
            "message": f"7-day volatility elevated at {row['vol_7d']*100:.2f}%",
        })

    is_panic = len(signals) >= 2
    return {
        "rule_based_panic": is_panic,
        "signals": signals,
        "signal_count": len(signals),
    }


# ── ML-based detection ─────────────────────────────────────────────────────
_model: Pipeline | None = None

def ml_detect(row: dict) -> dict:
    global _model
    if _model is None:
        _model = load_model()

    x = np.array([[row.get(f, 0) for f in FEATURES]])
    prob = float(_model.predict_proba(x)[0][1])
    label = int(_model.predict(x)[0])
    return {"ml_panic": bool(label), "panic_probability": round(prob, 4)}


# ── Combined detection ─────────────────────────────────────────────────────
def detect_panic_event(row: dict) -> dict:
    rule = rule_based_detect(row)
    ml   = ml_detect(row)

    # ensemble: panic if either rule OR ML (high prob) flags it
    combined = rule["rule_based_panic"] or ml["panic_probability"] > 0.60

    severity = "NORMAL"
    if combined:
        p = ml["panic_probability"]
        severity = "EXTREME" if p > 0.80 else "HIGH" if p > 0.60 else "MODERATE"

    return {
        **rule,
        **ml,
        "panic_detected": combined,
        "severity": severity,
    }


# ── Herd behavior score ────────────────────────────────────────────────────
def get_herd_score(fund_ids: list[str], start: str, end: str) -> dict:
    """
    Herd score = correlation of outflow spikes across funds in the window.
    High correlation = investors moving together = herd behavior.
    """
    df = _load_data()
    mask = (
        (df["date"] >= pd.Timestamp(start)) &
        (df["date"] <= pd.Timestamp(end)) &
        (df["fund_id"].isin(fund_ids))
    )
    sub = df[mask].pivot(index="date", columns="fund_id", values="net_flow").dropna()

    if sub.shape[0] < 5 or sub.shape[1] < 2:
        return {"herd_score": 0.0, "interpretation": "Insufficient data"}

    corr_matrix = sub.corr()
    # average off-diagonal correlation – copy to avoid read-only array error
    cm = corr_matrix.values.copy()
    np.fill_diagonal(cm, np.nan)
    avg_corr = float(np.nanmean(cm))
    avg_corr = max(0.0, avg_corr)

    interpretation = (
        "Extreme herd behavior" if avg_corr > 0.8 else
        "Strong herd behavior"  if avg_corr > 0.6 else
        "Moderate herd behavior" if avg_corr > 0.4 else
        "Low herd behavior"
    )
    return {
        "herd_score": round(avg_corr, 4),
        "interpretation": interpretation,
        "fund_count": len(fund_ids),
        "period": {"start": start, "end": end},
    }
