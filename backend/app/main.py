"""
Premier League Predictions API
FastAPI application serving 4 ML models for PL predictions
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import bo1, bo2, bo3, bo4, bo5

app = FastAPI(
    title="Premier League Predictions API",
    description="ML-powered predictions for PL season rankings, match outcomes, team styles, and player recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://the-12th-player-app.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bo1.router, prefix="/api/v1", tags=["Season Rankings"])
app.include_router(bo2.router, prefix="/api/v1", tags=["Match Predictions"])
app.include_router(bo3.router, prefix="/api/v1", tags=["Team Styles"])
app.include_router(bo4.router, prefix="/api/v1", tags=["Player Recommendations"])
app.include_router(bo5.router, prefix="/api/v1", tags=["News Credibility"])

@app.get("/")
async def root():
    return {
        "message": "Premier League Predictions API",
        "version": "1.0.0",
        "endpoints": {
            "season_rankings": "/api/v1/predict-season",
            "match_prediction": "/api/v1/predict-match",
            "team_style": "/api/v1/team-style/{team_name}",
            "player_recommendations": "/api/v1/players/recommendations"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
