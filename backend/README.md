# SheepOrSleep Backend

## Quick Start

```bash
cd backend
pip install -r requirements.txt

# 1. Generate synthetic data
python data/generate_data.py

# 2. Start API server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/funds` | List available funds |
| GET | `/nav-data` | NAV + flow time-series |
| GET | `/detect-behavior` | Detect panic/herd for a fund/date |
| GET | `/panic-tax` | Simulate panic tax |
| GET | `/compare-strategy` | Disciplined vs panic seller chart |
| GET | `/herd-score` | Herd behavior score |
| GET | `/nudges` | Personalized behavioral nudges |
| GET | `/panic-windows` | Historical panic event windows |
| GET | `/dashboard-summary` | All metrics in one call |

Interactive docs at: http://localhost:8000/docs
