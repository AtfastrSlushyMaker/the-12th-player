"""
Pydantic request schemas for all API endpoints
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional

# ===== BO1: Season Ranking =====

class TeamStats(BaseModel):
    """Individual team statistics for season ranking"""
    team: str = Field(..., description="Team name (must match teams.json)")
    wins: int = Field(..., ge=0, le=38, description="Number of wins")
    draws: int = Field(..., ge=0, le=38, description="Number of draws")
    losses: int = Field(..., ge=0, le=38, description="Number of losses")
    goals_scored: int = Field(..., ge=0, description="Total goals scored")
    goals_conceded: int = Field(..., ge=0, description="Total goals conceded")
    clean_sheets: int = Field(0, ge=0, description="Number of clean sheets")
    win_rate: Optional[float] = Field(None, ge=0, le=1, description="Win rate (auto-calculated if not provided)")
    
    @validator('team')
    def validate_team_name(cls, v):
        # Note: Will validate against teams.json in the endpoint
        return v.strip()

class SeasonRankingRequest(BaseModel):
    """Request for season ranking predictions"""
    season: str = Field(..., description="Season (e.g., '2025-26')")
    teams: List[TeamStats] = Field(..., min_items=1, max_items=20, description="List of team statistics")
    
    class Config:
        schema_extra = {
            "example": {
                "season": "2025-26",
                "teams": [
                    {
                        "team": "Arsenal",
                        "wins": 15,
                        "draws": 3,
                        "losses": 2,
                        "goals_scored": 45,
                        "goals_conceded": 18,
                        "clean_sheets": 8,
                        "win_rate": 0.75
                    }
                ]
            }
        }

# ===== BO2: Match Prediction =====

class MatchPredictionRequest(BaseModel):
    """Request for single match outcome prediction"""
    home_team: str = Field(..., description="Home team name")
    away_team: str = Field(..., description="Away team name")
    season: str = Field("2025-26", description="Season for context")
    expert_mode: bool = Field(False, description="Enable expert mode with feature importance")
    
    @validator('home_team', 'away_team')
    def validate_team_names(cls, v):
        return v.strip()
    
    @validator('away_team')
    def validate_different_teams(cls, v, values):
        if 'home_team' in values and v == values['home_team']:
            raise ValueError("Home and away teams must be different")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "home_team": "Arsenal",
                "away_team": "Man City",
                "season": "2025-26",
                "expert_mode": False
            }
        }

# ===== BO3: Team Style (Query params, no request body) =====

# ===== BO4: Player Recommendations (Query params, no request body) =====
