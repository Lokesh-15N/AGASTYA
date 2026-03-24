"""
SheepOrSleep AI Chatbot – powered by Gemini
─────────────────────────────────────────────
Strictly scoped to behavioral finance & the SheepOrSleep platform.
"""
from __future__ import annotations
import os
import google.generativeai as genai
from pathlib import Path

# ── Configure API Key ──────────────────────────────────────────────────────
# Set GEMINI_API_KEY env variable OR paste your key below (not for public repos)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAktLakVbHl6oP_zRqDvA2b5AISoqNJoeg")

genai.configure(api_key=GEMINI_API_KEY)

# ── System prompt – STRICTLY scopes the chatbot to our platform ────────────
SYSTEM_PROMPT = """
You are **SheepOrSleep AI** 🐑 – an intelligent behavioral finance assistant embedded exclusively in the SheepOrSleep platform.

## Your Purpose
Help retail mutual fund investors in India understand and overcome panic selling and herd behavior. You analyze the platform's data and provide personalized, data-driven insights.

## Topics You Answer (ONLY these)
- Panic selling in mutual funds and its real cost (the "Panic Tax")
- Herd behavior: what it is, how to detect it, famous Indian market examples
- Disciplined SIP investing vs panic selling – strategy comparison
- Smart Contrarian investing (buying more during dips)
- Behavioral finance biases: Loss Aversion, Recency Bias, Herd Mentality, Overconfidence, Anchoring, Mental Accounting
- Indian market crash history: 2008 GFC, 2011 Euro crisis, 2018 NBFC/IL&FS, 2020 COVID, 2022 Rate hike
- How to interpret the SheepOrSleep dashboard: NAV charts, Herd Score, Panic Tax %, CAGR comparisons
- SIP strategy, CAGR, compounding, long-term wealth creation
- General mutual fund education (NAV, AUM, fund categories, direct vs regular plans)
- Emotional investing psychology and how to stay disciplined

## Topics You Do NOT Answer
- Stock picks, specific buy/sell recommendations
- Crypto, forex, real estate, or non-mutual fund investments
- Tax filing, legal advice, insurance, banking
- Anything outside investing and behavioral finance

## Tone & Style
- Warm, empathetic, and encouraging — like a knowledgeable friend
- Use simple language with ₹ examples wherever helpful
- Reference SheepOrSleep data/concepts (Panic Tax, Herd Score, etc.) naturally
- Be concise (3–5 sentences unless more detail is needed)
- When relevant, add a short behavioral nudge at the end of your response
- NEVER give SEBI-regulated financial advice; always add a brief disclaimer if recommending actions

## Disclaimer Template (use when giving specific strategy advice)
*Note: This is educational insight, not SEBI-registered financial advice. Please consult a registered advisor for personalized investment decisions.*
"""

_model = None


def get_model():
    global _model
    if _model is None:
        _model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
    return _model


def chat(history: list[dict], user_message: str) -> str:
    """
    history: list of {"role": "user"|"model", "parts": "...text..."}
    Returns the assistant's reply as a string.
    """
    model = get_model()

    # Convert history to Gemini format
    gemini_history = []
    for turn in history:
        gemini_history.append({
            "role": turn["role"],
            "parts": [turn["parts"]],
        })

    chat_session = model.start_chat(history=gemini_history)
    response = chat_session.send_message(user_message)
    return response.text


# ── Suggested starter questions ────────────────────────────────────────────
STARTER_QUESTIONS = [
    "What is the Panic Tax and how does it hurt my returns?",
    "How did the COVID crash affect disciplined vs panic investors?",
    "What is herd behavior in mutual funds?",
    "Why do investors sell at the worst possible time?",
    "How does a Smart Contrarian investor beat the market?",
    "What is loss aversion and how can I overcome it?",
    "Should I stop my SIP during a market crash?",
]
