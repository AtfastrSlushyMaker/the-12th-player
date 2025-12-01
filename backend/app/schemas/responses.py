"""
Pydantic response schemas for all API endpoints
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# ===== BO1: Season Ranking =====

class TeamPrediction(BaseModel):
    """Single team's predicted position"""
    rank: int = Field(..., description="Final predicted rank (1-20)")
    team: str = Field(..., description="Team name")
    predicted_position: float = Field(..., description="Raw predicted position (may be decimal)")
    confidence: str = Field(..., description="Confidence level (high/medium/low)")

class ModelMetadata(BaseModel):
    """Model performance metadata"""
    algorithm: str = Field(..., description="ML algorithm used")
    mae: Optional[float] = Field(None, description="Mean Absolute Error")
    r2_score: Optional[float] = Field(None, description="R² score")
    accuracy: Optional[float] = Field(None, description="Model accuracy")
    version: Optional[str] = Field(None, description="Model version")

class SeasonRankingResponse(BaseModel):
    """Response for season ranking predictions"""
    season: str
    predictions: List[TeamPrediction]
    model_metadata: ModelMetadata
    
    class Config:
        schema_extra = {
            "example": {
                "season": "2025-26",
                "predictions": [
                    {
                        "rank": 1,
                        "team": "Man City",
                        "predicted_position": 1.2,
                        "confidence": "high"
                    }
                ],
                "model_metadata": {
                    "algorithm": "KNN Regressor",
                    "mae": 1.15,
                    "r2_score": 0.938
                }
            }
        }

# ===== BO2: Match Prediction =====

class MatchProbabilities(BaseModel):
    """Match outcome probabilities"""
    home_win: float = Field(..., ge=0, le=1)
    draw: float = Field(..., ge=0, le=1)
    away_win: float = Field(..., ge=0, le=1)

class FeatureImportance(BaseModel):
    """Feature importance for expert mode"""
    feature: str
    value: Any
    importance: float

class MatchPredictionResponse(BaseModel):
    """Response for match prediction"""
    prediction: str = Field(..., description="Predicted outcome (Home Win/Draw/Away Win)")
    probabilities: MatchProbabilities
    confidence: str = Field(..., description="Prediction confidence (high/medium/low)")
    feature_importance: Optional[List[FeatureImportance]] = Field(None, description="Feature importance (expert mode only)")
    model_accuracy: Optional[float] = Field(None, description="Model accuracy (expert mode only)")
    
    class Config:
        schema_extra = {
            "example": {
                "prediction": "Home Win",
                "probabilities": {
                    "home_win": 0.45,
                    "draw": 0.30,
                    "away_win": 0.25
                },
                "confidence": "medium",
                "feature_importance": [
                    {"feature": "home_wins_L5", "value": 4, "importance": 0.15}
                ],
                "model_accuracy": 0.592
            }
        }

# ===== BO3: Team Style =====

class ClusterInfo(BaseModel):
    """Cluster information"""
    id: int
    label: str
    description: str

class TeamStyleResponse(BaseModel):
    """Response for team tactical style"""
    team: str
    season: str
    cluster: ClusterInfo
    similar_teams: List[str]
    probabilities: Optional[Dict[str, float]] = Field(None, description="Cluster membership probabilities")
    stats: Dict[str, float] = Field(..., description="Key tactical statistics")
    
    class Config:
        schema_extra = {
            "example": {
                "team": "Arsenal",
                "season": "2024-25",
                "cluster": {
                    "id": 0,
                    "label": "Attacking",
                    "description": "High-scoring teams with aggressive offensive tactics"
                },
                "similar_teams": ["Man City", "Liverpool", "Tottenham"],
                "stats": {
                    "avg_goals_scored": 2.1,
                    "avg_shots": 18.5,
                    "shot_accuracy": 0.42
                }
            }
        }

# ===== BO4: Player Recommendations =====

class PlayerStats(BaseModel):
    """Player performance statistics"""
    goals_per_90: Optional[float] = None
    assists_per_90: Optional[float] = None
    pass_completion: Optional[float] = None
    tackles_per_90: Optional[float] = None
    saves_per_90: Optional[float] = None
    # Position-specific stats added dynamically

class PlayerRecommendation(BaseModel):
    """Individual player recommendation"""
    rank: int
    player: str
    squad: str
    league: Optional[str] = None
    age: int
    market_value: Optional[float] = Field(None, description="Market value in euros")
    predicted_score: float = Field(..., description="Predicted performance score (0-1)")
    stats: Dict[str, Any]

class PlayerRecommendationsResponse(BaseModel):
    """Response for player recommendations"""
    position: str
    filters: Dict[str, Any]
    recommendations: List[PlayerRecommendation]
    
    class Config:
        schema_extra = {
            "example": {
                "position": "midfielder",
                "filters": {
                    "max_age": 23,
                    "limit": 10
                },
                "recommendations": [
                    {
                        "rank": 1,
                        "player": "Martin Ødegaard",
                        "squad": "Arsenal",
                        "age": 22,
                        "market_value": 45000000,
                        "predicted_score": 0.892,
                        "stats": {
                            "goals_per_90": 0.45,
                            "assists_per_90": 0.38,
                            "pass_completion": 88.5
                        }
                    }
                ]
            }
        }
