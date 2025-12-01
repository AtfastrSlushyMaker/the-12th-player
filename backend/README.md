# Premier League Predictions API - Backend

FastAPI backend serving 4 ML models for Premier League predictions.

## Features

- **BO1**: Season Ranking Prediction (KNN Regressor)
- **BO2**: Match Outcome Prediction (Random Forest)
- **BO3**: Team Tactical Style Clustering (KMeans)
- **BO4**: Player Recommendations (LightGBM)

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify Models

Ensure all 9 model files are in `models/` directory:
- bo1_season_ranking.pkl
- bo2_match_prediction.pkl
- bo3_kmeans_clustering.pkl
- bo4_defender_lgb.pkl
- bo4_midfielder_lgb.pkl
- bo4_forward_lgb.pkl
- bo4_goalkeeper_lgb.pkl
- teams.json
- team_encoding.json

### 4. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### BO1: Season Rankings
```
POST /api/v1/predict-season
```
Predict final league positions (1-20) for teams.

### BO2: Match Prediction
```
POST /api/v1/predict-match
```
Predict match outcome (Home Win/Draw/Away Win).

### BO3: Team Style
```
GET /api/v1/team-style/{team_name}?season=2024-25
```
Get team's tactical playing style.

### BO4: Player Recommendations
```
GET /api/v1/players/recommendations?position=midfielder&limit=10
```
Get top player recommendations by position.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── api/
│   │   ├── bo1.py           # Season ranking endpoint
│   │   ├── bo2.py           # Match prediction endpoint
│   │   ├── bo3.py           # Team style endpoint
│   │   └── bo4.py           # Player recommendations endpoint
│   ├── core/
│   │   ├── model_loader.py  # Model loading utilities
│   │   └── preprocessing.py # Feature engineering
│   └── schemas/
│       ├── requests.py      # Pydantic request models
│       └── responses.py     # Pydantic response models
├── models/                  # ML model files (.pkl)
├── requirements.txt
└── README.md
```

## Environment Variables (Optional)

Create a `.env` file:

```
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=True
```

## Deployment

### Railway / Render

1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing

```bash
# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/team-style/Arsenal?season=2024-25
```

## License

MIT
