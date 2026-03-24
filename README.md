# SheepOrSleep 🐑

> **Panic Selling & Herd Behavior Detection Platform** for Mutual Fund Investors

SheepOrSleep is a behavioral finance analytics platform that detects panic selling and herd behavior in mutual fund markets, calculates the **Panic Tax** (wealth lost due to emotional selling), and nudges investors to make disciplined decisions.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 📸 Features

| Page | Description |
|------|-------------|
| 🏠 **Overview** | Panic alert banner, 6 live KPIs, historical panic windows, smart nudges |
| 📉 **NAV & Flows** | NAV time-series chart, investor net flow chart, 7-day rolling volatility — all with red-shaded panic zones |
| ⚖️ **Strategy Compare** | Disciplined SIP vs Panic Seller portfolio growth curves, CAGR bar chart, detected panic events table |
| 🐑 **Herd Behavior** | Animated herd score gauge (0–100%), period presets for COVID/NBFC/Rate-Hike/Bull Run |
| 💡 **Smart Nudges** | Personalized behavioral finance nudges + Loss Aversion / Herd Mentality education cards |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · Uvicorn |
| Data | Pandas · NumPy · scikit-learn (RandomForest) |
| Frontend | React 19 · Vite 8 · Recharts |
| Visualization | Recharts (AreaChart, LineChart, BarChart, ReferenceArea) |
| Styling | Pure CSS with dark-mode design system |

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data (2017-2024, 3 funds, 6,261 rows)
python data/generate_data.py

# Start API server
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/funds` | List available funds |
| GET | `/nav-data` | NAV + flow time-series |
| GET | `/detect-behavior` | Rule-based + ML panic detection |
| GET | `/panic-tax` | Simulate panic tax |
| GET | `/compare-strategy` | Disciplined vs panic seller chart data |
| GET | `/herd-score` | Herd behavior score |
| GET | `/nudges` | Personalized behavioral nudges |
| GET | `/panic-windows` | Historical panic event windows |
| GET | `/dashboard-summary` | All metrics in one call |

---

## 🧠 How It Works

### Panic Tax Calculation
```
Panic Tax = Disciplined Final Value − Panic Seller Final Value
```
- **Disciplined investor**: Monthly SIP ₹10,000, never exits
- **Panic seller**: Exits on detected panic signals, re-enters after 60 business days

### Behavior Detection (2-layer)
1. **Rule-based**: NAV drop from 30d peak > 3% + outflow spike > ₹50 Cr + vol > 1.5%
2. **ML model**: RandomForest trained on labeled panic/normal periods

### Herd Score
Average correlation of net outflows across all funds in a date window. High correlation = synchronized exits = herd behavior.

---

## 📊 Simulated Data

Synthetic data with realistic panic events:

| Event | Period | Severity |
|-------|--------|----------|
| IL&FS / NBFC Crisis | Sep–Nov 2018 | HIGH |
| COVID-19 Crash | Feb–Mar 2020 | EXTREME |
| Global Rate-Hike Bear | Jan–Jun 2022 | HIGH |

---

## 🗂️ Project Structure

```
PS-8/
├── backend/
│   ├── main.py                    # FastAPI application (9 endpoints)
│   ├── requirements.txt
│   ├── data/
│   │   ├── generate_data.py       # Synthetic data generator
│   │   ├── master_data.csv        # Generated dataset (gitignored)
│   │   ├── funds.json
│   │   └── panic_windows.json
│   └── engines/
│       ├── behavior_engine.py     # Panic + herd detection engine
│       ├── panic_tax.py           # Portfolio simulation engine
│       └── nudge_engine.py        # Behavioral nudge library
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx                # Shell with sidebar + fund selector
        ├── api.js                 # Axios API client
        ├── index.css              # Dark-mode design system
        └── components/
            ├── Overview.jsx
            ├── NavChart.jsx
            ├── Compare.jsx
            ├── Herd.jsx
            └── Nudges.jsx
```

---

## 👥 User Personas

- **Retail SIP Investors** – Need nudges to stay disciplined during market dips
- **Long-term Investors** – Want to understand the cost of panic selling over 5–10 years

---

## 🏆 Hackathon Ready

Demo scenario:
1. Select **Multicap Momentum Fund** (higher beta = bigger swings)
2. Open **Strategy Compare** → see ₹ wealth gap between disciplined vs panic investor
3. Switch to **Herd Behavior** → select COVID Crash → see 90% herd score
4. Open **Smart Nudges** → show personalized behavioral interventions

**Pitch**: Problem → panic selling costs Indian retail investors billions annually → Solution → detect, quantify, and nudge → Impact → disciplined SIP beats market timing by 2–5% CAGR
