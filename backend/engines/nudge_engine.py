"""
Nudge Engine
────────────
Generates personalized behavioral nudges based on current market conditions,
using loss-aversion and long-term benefit framing.
"""
from __future__ import annotations
import random

NUDGE_LIBRARY = [
    # loss-aversion framing
    {
        "type": "loss_aversion",
        "title": "Don't Let Fear Cost You!",
        "template": "Investors who exited during the {event} lost an average of ₹{loss:,.0f} more "
                    "than those who stayed. Selling now could repeat the same mistake.",
        "icon": "🚨",
        "severity": ["HIGH", "EXTREME"],
    },
    {
        "type": "loss_aversion",
        "title": "Volatility is Temporary",
        "template": "Markets have dropped {drop:.1f}% from their recent peak — but historically, "
                    "every such dip has been followed by a full recovery within {months} months.",
        "icon": "📉",
        "severity": ["MODERATE", "HIGH", "EXTREME"],
    },
    # long-term benefit framing
    {
        "type": "long_term",
        "title": "Stay the Course — Your Future Self Will Thank You",
        "template": "A disciplined investor who rode out every crash since 2017 is now "
                    "₹{profit:,.0f} richer than one who panicked and exited.",
        "icon": "💰",
        "severity": ["MODERATE", "HIGH", "EXTREME"],
    },
    {
        "type": "long_term",
        "title": "SIP Works Best in Dips",
        "template": "Your monthly SIP is actually buying more units at lower prices right now. "
                    "This is exactly when patience pays off — your cost average is improving!",
        "icon": "📈",
        "severity": ["MODERATE", "HIGH", "EXTREME"],
    },
    # herd behavior
    {
        "type": "herd",
        "title": "Don't Follow the Herd",
        "template": "Herd score is {herd:.0%} — {herd_interp}. "
                    "The majority are panic-selling, but research shows contrarians consistently outperform.",
        "icon": "🐑",
        "severity": ["MODERATE", "HIGH", "EXTREME"],
    },
    # calm market
    {
        "type": "calm",
        "title": "Markets Are Stable",
        "template": "Current volatility is low and investor flows are healthy. "
                    "Your portfolio is on track — no action needed.",
        "icon": "✅",
        "severity": ["NORMAL"],
    },
]

HISTORICAL_EVENTS = {
    "COVID-19 Crash": {
        "avg_loss_if_exited": 142_000,
        "recovery_months": 6,
        "profit_disciplined": 230_000,
    },
    "IL&FS / NBFC Crisis": {
        "avg_loss_if_exited": 68_000,
        "recovery_months": 9,
        "profit_disciplined": 95_000,
    },
    "Global Rate-Hike Bear": {
        "avg_loss_if_exited": 55_000,
        "recovery_months": 12,
        "profit_disciplined": 80_000,
    },
}


def generate_nudges(
    severity: str,
    nav_drop_pct: float,
    herd_score: float,
    herd_interp: str,
    panic_tax_amount: float = 0.0,
    closest_event: str = "COVID-19 Crash",
) -> list[dict]:
    """
    Returns a list of 2-3 nudges relevant to the current market state.
    """
    eligible = [n for n in NUDGE_LIBRARY if severity in n["severity"]]
    if not eligible:
        eligible = [n for n in NUDGE_LIBRARY if "NORMAL" in n["severity"]]

    event_data = HISTORICAL_EVENTS.get(closest_event, HISTORICAL_EVENTS["COVID-19 Crash"])

    rendered = []
    for nudge in eligible:
        try:
            msg = nudge["template"].format(
                event=closest_event,
                loss=event_data["avg_loss_if_exited"],
                drop=abs(nav_drop_pct),
                months=event_data["recovery_months"],
                profit=event_data["profit_disciplined"],
                herd=herd_score,
                herd_interp=herd_interp,
            )
        except KeyError:
            msg = nudge["template"]

        rendered.append({
            "type":    nudge["type"],
            "title":   nudge["title"],
            "message": msg,
            "icon":    nudge["icon"],
        })

    # Return up to 3, shuffled but calm always last if present
    calm = [n for n in rendered if n["type"] == "calm"]
    non_calm = [n for n in rendered if n["type"] != "calm"]
    random.shuffle(non_calm)
    result = non_calm[:3] if not calm else calm[:1]
    return result
