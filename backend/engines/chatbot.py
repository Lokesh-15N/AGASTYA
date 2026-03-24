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

SYSTEM_PROMPT = """
You are SheepOrSleep AI, a concise behavioral finance assistant.
Only discuss mutual funds, panic selling, herd behavior, and long-term discipline.
Refuse other topics. Be brief (2-3 sentences max).
Use simple language with ₹ examples.
*Disclaimer: Not SEBI-registered financial advice.*
"""

_model = None


def get_model():
    global _model
    if _model is None:
        _model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
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
