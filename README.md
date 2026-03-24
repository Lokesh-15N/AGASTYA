# 🐑 SheepOrSleep
> **A Behavioral Finance Platform for Mutual Fund Investors**

*Detecting Panic. Rewarding Patience.*

![SheepOrSleep Dashboard](https://images.unsplash.com/photo-1611974789855-9c2a0a223690?q=80&w=2670&auto=format&fit=crop)

---

## 📋 Project Title and Description

### Title
**SheepOrSleep: Behavioral Bias Detector for Mutual Fund Investors**

### Tagline
*"Detecting Panic. Rewarding Patience."*

### Description

SheepOrSleep is an interactive, full-stack behavioral finance analytics platform built to expose and quantify **the true cost of emotional panic-selling** in retail mutual fund investing. 

By analyzing over 22,000 days of real-world historical NAV data across popular Indian mutual funds (like Mirae Asset Large Cap, Parag Parikh Flexi Cap, and UTI Nifty 50), the platform proves mathematically why disciplined investing and smart contrarian behavior outperform "herd" psychology. The platform detects panic-selling patterns using historical NAV and investor flow data, visualizes wealth outcomes between disciplined and panic-driven investors, and empowers users with personalized nudges to make better financial decisions in times of market turbulence.

---

## ❌ Problem Statement

Retail mutual fund and SIP investors in India face significant behavioral biases:

- **Panic Selling During Market Dips**: Investors unconsciously follow herding behavior and sell mutual funds during market downturns, locking in losses at the worst possible time.
  
- **High Cost of Emotional Decisions**: Retail investors lose substantial wealth by exiting market downturns at the NAV trough and re-entering at significantly higher prices after the recovery.
  
- **Lack of Financial Awareness**: Most investors don't understand the true quantitative cost of panic-driven decisions or how disciplined investing would have performed in identical market conditions.

**Impact**: Studies show the average retail investor underperforms the market by 3-5% annually due to behavioral biases—translating to hundreds of thousands in lost long-term wealth.

---

## ✨ Features and Functionality

### 1. **💸 The Panic Tax Calculator**
A quantitative engine that compares three distinct investment strategies across major historical market crashes (2008 GFC, 2011 Euro Crisis, 2020 COVID, 2023 Banking Crisis, etc.):

- **Disciplined Investor**: Never exits the market; continues SIPs through downturns
- **Smart Contrarian 🎯**: Doubles SIP contribution during the height of a crash to buy at lower NAVs
- **Panic Seller**: Sells at the NAV trough due to fear and anxiety; re-enters 60 days after the market recovers

*Panic Tax* = Difference in final portfolio value between the Disciplined Investor and the Panic Seller strategy

### 2. **📈 Real AMFI Mutual Fund Data**
- Integrates directly with the `mfapi.in` public API to fetch 10+ years of historical, up-to-date NAV information
- Dynamic data fetching for 30+ popular Indian mutual funds
- Supports schemes across Large Cap, Flexi Cap, Multi-Asset, and Index Fund categories

### 3. **🤖 AI Financial Advisor (Gemini 2.5 Flash)**
- Custom-fitted Behavioral Finance AI assistant embedded in the dashboard
- Educational guidance on concepts like Recency Bias, Herd Mentality, Loss Aversion
- Real-time chat interface for investor queries
- Responses bounded to SEBI-compliant educational guidelines (not providing personalized financial advice)

### 4. **📉 Herd Behavior Detection Engine**
- Analyzes sudden mutual fund inflow/outflow divergences during panic events
- Visual gauge showing herd mentality scores across different market phases
- Identifies which funds experience the highest panic outflows during crashes

### 5. **💡 Smart Nudges Engine**
- Personalizes interventions based on investor behavior and market conditions
- Combats cognitive biases such as Loss Aversion, Herd Mentality, and Recency Bias
- Triggers nudges dynamically based on the current market status of selected funds
- Example: "Markets are down 15%. History shows 95% recovery within 2 years. Staying invested paid off in 2008, 2011, and 2020."

### 6. **🖌️ Frictionless Dark Mode UI**
- Built with React 19 and Vite for lightning-fast interactions
- Smooth `lenis` scroll animations for effortless navigation
- Dynamic gradient coloring tailored specifically for financial dashboards
- Responsive design for desktop and tablet users
- WCAG-compliant for accessibility

### 7. **📊 Interactive Dashboard**
- Visual comparison charts of the three strategies side-by-side
- Historical NAV trend overlays with market crash zones highlighted
- Portfolio growth curves with interactive tooltips
- Performance metrics and Panic Tax percentages in real-time

---

## 🛠️ Tech Stack Used

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 19** | Modern UI library with concurrent rendering |
| **Vite** | Lightning-fast build tool and dev server (vs. Webpack) |
| **Recharts** | Data visualization (AreaChart, BarChart, custom ReferenceArea for panic zones) |
| **Lenis** | Smooth scroll library for elegant UX |
| **Axios** | HTTP client for backend API communication |
| **React Router v7** | Client-side routing and navigation |
| **Vanilla CSS 3** | Extensive variable theming system for dynamic styling |

### **Backend**
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **Uvicorn** | ASGI server for FastAPI |
| **Pandas & NumPy** | Heavy quantitative simulations and data manipulation |
| **Scikit-learn** | RandomForestClassifier for panic-sell correlation modeling |
| **Google Generative AI** | Gemini 2.5 Flash integration for AI advisor |
| **Pydantic** | Data validation and settings management |
| **Python 3.13** | Latest Python version for optimal performance |

### **Data & APIs**
| Service | Purpose |
|---------|---------|
| **mfapi.in** | Public API for real-time mutual fund NAV data (AMFI-regulated) |
| **Google Generative AI API** | LLM for behavioral finance AI assistant |

### **DevOps & Tools**
- **Git** for version control
- **Python Virtual Environment** for dependency isolation
- **npm** for Node.js package management
- **ESLint** for code quality assurance

---

## 🚀 Setup/Installation Instructions

### Prerequisites
Before proceeding, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.13+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/)
- A text editor or IDE (VS Code recommended)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd AGASTYA
```

### Step 2: Backend Setup

Open a terminal and set up the Python environment:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install google-generativeai python-dotenv
```

**Fetch Real-Time Mutual Fund Data:**
```bash
python data/fetch_real_nav.py
```

**Set Up Your Gemini API Key:**
1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

**Start the FastAPI Backend Server:**
```bash
python -m uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Step 3: Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

# Install all dependencies
npm install

# Start the development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser to see SheepOrSleep in action!

### Step 4: Verify Both Servers Are Running

- **Backend**: `http://localhost:8000` (FastAPI with Swagger docs at `/docs`)
- **Frontend**: `http://localhost:5173` (React Vite dev server)

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
python -m uvicorn main:app --port 8000
```

---

## 👥 Team Details

| Role | Name | Contact |
|------|------|---------|
| **Project Lead** | [Your Name] | [Email/GitHub] |
| **Frontend Developer** | [Name] | [Email/GitHub] |
| **Backend Developer** | [Name] | [Email/GitHub] |
| **Data Science & ML** | [Name] | [Email/GitHub] |
| **UI/UX Designer** | [Name] | [Email/GitHub] |

### Contributions
- [GitHub Repository Link]
- [Project Documentation](./docs/)

**_Note: Team details should be updated with actual members' information._**

---

## 🚀 Future Scope

### Phase 2: Advanced Features
1. **Portfolio Backtesting Engine**
   - Allow users to upload their own portfolio and run it through the Panic Tax calculator
   - Historical returns analysis against various panic periods
   - Risk-adjusted metrics (Sharpe Ratio, Sortino Ratio)

2. **Multi-Asset Class Support**
   - Extend beyond mutual funds to include stocks, bonds, and international markets
   - Cross-asset correlation analysis during crashes

3. **Predictive Analytics**
   - Use ML models to predict when panic selling is likely to occur
   - Alert users to high-risk behavioral periods

4. **Goal-Based Planning**
   - Retirement planning with panic-tax considerations
   - Education planning and other long-term financial goals
   - Auto-calibration of SIP amounts based on goals

### Phase 3: Community & Engagement
1. **Social Features**
   - User portfolios and strategy comparison leaderboards
   - Community insights and discussion forums
   - Peer group behavior benchmarking

2. **Advanced Personalization**
   - User profiling based on historical behavior and psychology
   - AI-powered recommendation engine for fund selection and SIP amounts
   - Behavioral scorecards tracking improvement over time

### Phase 4: Monetization & Scale
1. **Premium Tier**
   - Advanced analytics and custom reports
   - Priority AI advisor access
   - Export capabilities for financial planning

2. **API & B2B**
   - Public API for fintech partners
   - White-label solutions for mutual fund companies
   - Integration with banking and investment platforms

3. **Mobile App**
   - React Native mobile application
   - Push notifications for Smart Nudges
   - Offline functionality for historical data

---

## 🧠 Behavioral Biases Addressed

The core mission of SheepOrSleep is to educate and empower investors to overcome six critical behavioral biases:

1. **Herd Mentality** 
   - Issue: "Everyone is selling, so I should sell too."
   - Our Solution: Herd behavior detection analytics show how others panic; historical data proves staying invested pays off

2. **Loss Aversion**
   - Issue: "I can't stomach seeing my portfolio down 20%."
   - Our Solution: Smart Nudges and AI Advisor contextualize losses as temporary; Panic Tax shows recovery timelines

3. **Recency Bias**
   - Issue: "The market just crashed 10%; it will crash more!"
   - Our Solution: Historical comparison showing 2008, 2011, 2020 all recovered within 2 years

4. **Market Timing Illusion**
   - Issue: "I will sell now at the bottom and buy back higher."
   - Our Solution: Quantitatively proven through Panic Tax curves—even professionals can't time the market

5. **Anchoring**
   - Issue: "The NAV was ₹150; I won't sell until it reaches back to ₹150."
   - Our Solution: Focus on returns percentage and long-term goals rather than absolute prices

6. **Overconfidence**
   - Issue: "I can pick the funds that will outperform."
   - Our Solution: Data-driven insights showing index funds and disciplined SIPs outperform active picking

---

## 📚 Learning Resources

- [Behavioral Finance and Investor Psychology](https://en.wikipedia.org/wiki/Behavioral_finance)
- [How to Avoid Panic Selling](https://www.investopedia.com/articles/stocks/10/panic-selling.asp)
- [SEBI Guidelines for Mutual Fund Investments](https://www.sebi.gov.in/)

---

## 🔗 API Documentation

### Backend Endpoints

**FastAPI Swagger Documentation:**
Navigate to `http://localhost:8000/docs` for interactive API documentation.

Example endpoints:
- `GET /api/funds` - Get list of available mutual funds
- `POST /api/panic-tax` - Calculate Panic Tax for given parameters
- `GET /api/herd-metrics` - Fetch herd behavior metrics
- `POST /api/chat` - AI Financial Advisor chat endpoint

---

## 📄 License

This project is provided as-is for educational and hackathon demonstration purposes. See [LICENSE](./LICENSE) for details.

---

## ⚖️ Disclaimer

**Important**: The contents of this platform—including outputs generated by the Gemini AI Chatbot, historical return extrapolations, and mutual fund comparisons—are strictly for **educational and demonstration purposes only.**

- SheepOrSleep is **NOT** providing SEBI-registered financial advisory services
- This platform is **NOT** a substitute for professional financial advice
- Mutual Fund investments are subject to market risks; read all scheme documents carefully before investing
- Past performance is not indicative of future results
- Please consult a SEBI-registered investment advisor before making investment decisions

---

## 📧 Support & Feedback

Have questions or suggestions? Feel free to:
- Open an [Issue](https://github.com/) on GitHub
- Email us at: [support email]
- Join our [Discord Community](https://discord.gg/)

---

**Made with ❤️ by the SheepOrSleep Team**
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
>>>>>>> 5537d980d8bd36efb212c9ff00be6cd76dc24b45
