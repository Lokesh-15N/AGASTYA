# 🐑 SheepOrSleep
## *Detecting Panic. Rewarding Patience.*

---

## 📋 Project Title and Description

### Title
**SheepOrSleep: A Behavioural Bias Detector for Mutual Fund Investors**

### Tagline
*"Detecting Panic. Rewarding Patience."*

### Description
SheepOrSleep is a behavioral finance analytics platform that detects panic selling and herd behavior in mutual fund markets using historical NAV data and retail investor flows. The platform calculates the **Panic Tax** (wealth lost due to emotional selling), visualizes the gap between disciplined vs. panic-driven investors, and provides personalized nudges to help investors make disciplined financial decisions.

---

## ❌ Problem Statement

Mutual fund and SIP investors in India face significant behavioral biases:

- **Panic Selling During Market Dips**: Investors follow herding behavior and sell mutual funds during market downturns, locking in losses at the worst time.
- **High Cost of Emotional Decisions**: Retail investors lose substantial wealth by exiting during market crashes and re-entering at higher prices.
- **Lack of Financial Awareness**: Most investors don't understand the true cost of panic-driven decisions or how disciplined investing would have performed.

**Our Solution:**
- Detect panic-selling patterns using historical NAV and investor flow data
- Visualize wealth outcomes of disciplined investors vs. panic sellers
- Provide personalized behavioral nudges to counteract irrational decisions
- Quantify the "Panic Tax" — exact wealth lost due to emotional trading
- Classify investors into behavioral categories: Panic Seller, Herd Investor, Disciplined Investor, Smart Investor

---

## ✨ Features and Functionality

| Feature | Description |
|---------|-------------|
| 🏠 **Overview Dashboard** | Real-time panic alerts, 6 key KPIs, historical panic windows, personalized nudges |
| 📉 **NAV & Flows Analysis** | Interactive time-series charts showing NAV movements, investor flows, volatility with panic zones highlighted |
| ⚖️ **Strategy Comparison** | Side-by-side comparison of disciplined SIP vs. panic seller portfolio performance, CAGR analysis, wealth gap visualization |
| 🐑 **Herd Behavior Detection** | Real-time herd score gauge (0–100%), period-based analysis (COVID, NBFC crisis, rate hikes, bull runs), behavioral classification |
| 💡 **Smart Nudge System** | AI-powered personalized nudges, behavioral finance education cards (Loss Aversion, Herd Mentality), timely intervention during panic events |
| 📊 **Panic Tax Calculator** | Quantifies exact wealth lost due to emotional selling decisions |
| 🤖 **ML-Powered Behavior Detection** | RandomForest classifier trained on panic/normal periods for predictive alerts |
| 📱 **Interactive Visualizations** | Real-time charts, animated gauges, drill-down analytics, panic zone shading |

---

## 🛠️ Tech Stack Used

### Backend
- **Framework**: Python, FastAPI, Uvicorn
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: scikit-learn (RandomForest), scikit-learn utilities
- **API Documentation**: Swagger/OpenAPI (FastAPI built-in)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Charting Library**: Recharts (AreaChart, LineChart, BarChart, ReferenceArea)
- **Styling**: Pure CSS with dark-mode design system
- **Package Manager**: npm

### Data & Analytics
- **Historical Data**: Mutual Fund NAV datasets (AMFI)
- **Time-Series Analysis**: pandas for temporal analysis
- **Model Training**: scikit-learn for classification and behavior prediction

---

## 🚀 Setup/Installation Instructions

### Prerequisites
- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm** (comes with Node.js)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic historical data (2017-2024, 3 funds, 6,261 rows)
python data/generate_data.py

# Start the API server
python -m uvicorn main:app --reload --port 8000

# API Documentation available at: http://localhost:8000/docs
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Running Both Services

For local development with both services running:

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Live Demo Endpoints

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/docs |

---

## 👥 Team Details

| Name | Role | Contributions |
|------|------|---|
| **[Your Name]** | [Your Role] | [Key Contributions] |
| **[Team Member 2]** | [Role] | [Contributions] |
| **[Team Member 3]** | [Role] | [Contributions] |

*To be updated with actual team information*

---

## 🔮 Future Scope

### Phase 2 Features (Planned)
- **Mobile App**: Native mobile application (iOS/Android) for on-the-go monitoring
- **Real-time Alerts**: Push notifications for panic detection events
- **Integration with Investment Apps**: Connect with Groww, Zerodha, Paytm Money, Kuvera
- **Advanced ML Models**: Deep Learning models for better panic prediction
- **Portfolio Clustering**: Analyze panic behavior across fund categories
- **Behavioral Coaching**: AI-powered investment coach with personalized recommendations
- **Risk Profiling**: Psychometric assessment for investor risk tolerance vs. actual behavior

### Scalability Improvements
- **Cloud Deployment**: AWS/Azure/GCP containerization
- **Real-time Data Pipeline**: Kafka/Redis for live data streaming
- **Database Optimization**: PostgreSQL with advanced indexing
- **Caching Layer**: Redis for performance optimization

### Business Expansion
- **B2B Partnerships**: White-label solution for financial institutions
- **API for Third-party Apps**: Expose core APIs for external developers
- **Advanced Analytics**: Premium tier with backtesting and scenario analysis
- **Financial Advisor Dashboard**: Tools for advisors to monitor client behavior

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/funds` | List available mutual funds |
| GET | `/nav-data` | NAV + investor flow time-series data |
| GET | `/detect-behavior` | Detect panic behavior (rule-based + ML) |
| GET | `/panic-tax` | Calculate wealth loss from panic selling |
| GET | `/compare-strategy` | Compare disciplined vs. panic seller strategies |
| GET | `/herd-score` | Calculate herd behavior score |
| GET | `/nudges` | Get personalized behavioral nudges |
| GET | `/panic-windows` | Historical panic event periods |
| GET | `/dashboard-summary` | Complete dashboard data in one call |

---

## 🧠 How It Works

### Panic Tax Calculation
```
Panic Tax = Disciplined Final Value − Panic Seller Final Value
```

**Example:**
- **Disciplined investor**: Monthly SIP ₹10,000, never exits during dips
  - Final Value: ₹12,50,000 (10 years)
- **Panic seller**: Exits on detected panic signals, re-enters after 60 business days
  - Final Value: ₹8,20,000 (10 years)
- **Panic Tax (Wealth Lost)**: ₹4,30,000

### Behavior Detection (2-Layer System)

#### Layer 1: Rule-Based Detection
Identifies panic events based on:
- NAV drop from 30-day peak > 3%
- Outflow spike > ₹50 Cr
- Volatility > 1.5x baseline

#### Layer 2: ML Model
RandomForest classifier trained on labeled panic/normal periods to predict panic probability

### Investor Classification
| Investor Type | Behavior Score | Characteristics |
|---------------|---|---|
| **Panic Seller** | < -5 | Sells during dips, causes wealth loss |
| **Herd Investor** | -5 to 0 | Follows crowd, inconsistent behavior |
| **Disciplined Investor** | 0 to 5 | Continues SIP through cycles, long-term focus |
| **Smart Investor** | > 5 | Increases SIP during dips, accumulates more units |

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
