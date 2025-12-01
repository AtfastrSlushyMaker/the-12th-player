# The 12th Player ⚽

> **AI-powered football analytics platform for predictions, insights, and talent scouting across Europe's top leagues.**

🔗 **Live Demo**: [the-12th-player-app.onrender.com](https://the-12th-player-app.onrender.com/)

📊 **ML Models & Data**: [pl-standings-prediction-project](https://github.com/AtfastrSlushyMaker/pl-standings-prediction-project)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)

---

## 🎯 What is The 12th Player?

A full-stack machine learning application that provides:

- **Season Rankings** — Predict final Premier League standings using KNN
- **Match Predictor** — Forecast match outcomes with Random Forest  
- **Team Styles** — Classify tactical playing styles using KMeans clustering
- **Player Scout** — Discover rising talent across 5 European leagues with LightGBM

## 🏗️ Architecture

```
the-12th-man/
├── backend/                    # FastAPI REST API
│   ├── app/
│   │   ├── api/               # Endpoint handlers (bo1.py, bo2.py, bo3.py, bo4.py)
│   │   ├── core/              # Model loading & preprocessing
│   │   ├── data/processed/    # CSV datasets
│   │   └── schemas/           # Pydantic models
│   └── models/                # Trained ML models (.pkl)
│
└── frontend/                  # React + Vite SPA
    └── src/
        ├── pages/             # Route components
        ├── components/        # Reusable UI components
        └── lib/               # API client & utilities
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📊 Features

### Season Rankings (BO1)
- Predict final Premier League standings using historical team statistics
- KNN Regressor with MAE ~1.15 positions
- Compare predictions against actual final positions
- Select from 25 seasons of data (2000-01 to 2024-25)

### Match Predictor (BO2)
- Predict individual match outcomes with probability scores
- Random Forest Classifier achieving 59% test accuracy
- Features based on recent form (last 5 matches)
- Expert mode shows feature importances and model internals

### Team Styles (BO3)
- Classify teams into 5 tactical clusters:
  - 🔥 **Attacking** - High goals, aggressive play
  - 🛡️ **Defensive** - Clean sheets, solid backline
  - 🎯 **Possession** - Ball control, patient buildup
  - ⚡ **High-Press** - Intensive pressing, turnovers
  - ⚖️ **Pragmatic** - Balanced, adaptive approach
- Hexagonal radar visualization
- Season-by-season style evolution timeline

### Player Scout (BO4)
- Discover rising talent from Europe's top 5 leagues:
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
  - 🇪🇸 La Liga
  - 🇩🇪 Bundesliga
  - 🇮🇹 Serie A
  - 🇫🇷 Ligue 1
- Position-specific LightGBM models (Forward, Midfielder, Defender, Goalkeeper)
- Filter by age, minutes played
- Market value estimates and performance metrics

## 🤖 Models

All machine learning models were developed in the [pl-standings-prediction-project](https://github.com/AtfastrSlushyMaker/pl-standings-prediction-project) repository, which contains the full data analysis, preprocessing, and model training notebooks.

| Model | Algorithm | Performance | Features |
|-------|-----------|-------------|----------|
| `bo1_season_ranking.pkl` | KNN Regressor | MAE: 1.15, R²: 0.94 | 35 season aggregates |
| `bo2_match_prediction.pkl` | Random Forest | 59% accuracy | 12 match statistics |
| `bo3_kmeans_clustering.pkl` | KMeans (k=5) | Silhouette: 0.45 | Tactical metrics |
| `bo4_*_lgb.pkl` | LightGBM | Position-specific | Player performance stats |

## 📁 Datasets

### `team_season_aggregated.csv`
- **Rows**: ~500 (25 seasons × 20 teams)
- **Use Case**: Season standings prediction
- **Target**: Final_Position (1-20)

### `processed_premier_league_combined.csv`
- **Rows**: ~10,000 matches
- **Use Case**: Match outcome prediction
- **Target**: FTR_encoded (0=Home, 1=Draw, 2=Away)

### `players_24-25.csv`
- **Rows**: 2,854 players
- **Leagues**: Top 5 European leagues
- **Use Case**: Player scouting & recommendations

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **scikit-learn** - KNN, Random Forest, KMeans
- **LightGBM** - Gradient boosting for player models
- **Pandas** - Data manipulation
- **Pydantic** - Request/response validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Recharts** - Data visualization

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/seasons` | GET | List available seasons |
| `/api/v1/predict-season/{season}` | GET | Predict season standings |
| `/api/v1/predict-match` | POST | Predict match outcome |
| `/api/v1/team-style/{team}` | GET | Get team tactical style |
| `/api/v1/team-style-evolution/{team}` | GET | Style history across seasons |
| `/api/v1/players/recommend` | GET | Get player recommendations |
| `/api/v1/players/positions` | GET | Available player positions |

## 🎨 UI Features

- **Expert Mode** - Toggle detailed model information
- **Team Logos** - Real club badges from official sources
- **League Badges** - All 5 European league logos
- **Responsive Design** - Mobile-friendly interface
- **Green Theme** - Professional football aesthetic

## 📝 License

MIT

---

<p align="center">
  <strong>The 12th Player</strong> — Your AI-powered football analyst 🧠⚽<br>
  <a href="https://the-12th-player-app.onrender.com/">Try it live →</a>
</p>
