"""
BO2: Match Outcome Prediction Endpoint
Predicts individual match results (Home Win, Draw, Away Win) using Random Forest
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from pathlib import Path

from app.schemas.requests import MatchPredictionRequest
from app.schemas.responses import MatchPredictionResponse, MatchProbabilities, FeatureImportance
from app.core.model_loader import load_bo2, load_teams, load_team_encoding
from app.core.preprocessing import get_outcome_label, calculate_match_confidence

# Path to real match dataset
MATCHES_PATH = Path(__file__).parent.parent / 'data' / 'processed' / 'processed_premier_league_combined.csv'

router = APIRouter()

def load_matches_data() -> pd.DataFrame:
    """Load real match data from CSV dataset"""
    if not MATCHES_PATH.exists():
        raise FileNotFoundError(f"Matches dataset not found at {MATCHES_PATH}")
    return pd.read_csv(MATCHES_PATH)

def get_team_historical_stats(team: str, is_home: bool, df: pd.DataFrame = None) -> Dict:
    """
    Get team historical statistics from real dataset.
    Aggregates recent matches for the team to build stats.
    """
    if df is None:
        df = load_matches_data()
    
    # Filter matches for this team (home or away)
    if is_home:
        team_matches = df[df['HomeTeam'] == team].copy()
    else:
        team_matches = df[df['AwayTeam'] == team].copy()
    
    if team_matches.empty:
        # Fallback to defaults if team not found
        return {
            'shots': 12.0,
            'shots_on_target': 5.0,
            'fouls': 12.0,
            'corners': 5.0,
            'yellows': 1.5,
            'reds': 0.05,
            'wins': 5,
            'goals_scored': 1.3,
            'goals_conceded': 1.2,
            'form_wins': 2,
            'form_goals': 5
        }
    
    # Use recent matches (last 10) for form
    recent = team_matches.sort_values('Date').tail(10)
    
    # Calculate aggregated stats
    if is_home:
        wins = (team_matches['FTR'] == 'H').sum()
        goals_scored = team_matches['FTHG'].mean()
        goals_conceded = team_matches['FTAG'].mean()
        shots = team_matches['HS'].mean()
        shots_on_target = team_matches['HST'].mean()
        fouls = team_matches['HF'].mean()
        corners = team_matches['HC'].mean()
        yellows = team_matches['HY'].mean()
        reds = team_matches['HR'].mean()
        form_wins = (recent['FTR'] == 'H').sum()
        form_goals = recent['FTHG'].sum()
    else:
        wins = (team_matches['FTR'] == 'A').sum()
        goals_scored = team_matches['FTAG'].mean()
        goals_conceded = team_matches['FTHG'].mean()
        shots = team_matches['AS'].mean()
        shots_on_target = team_matches['AST'].mean()
        fouls = team_matches['AF'].mean()
        corners = team_matches['AC'].mean()
        yellows = team_matches['AY'].mean()
        reds = team_matches['AR'].mean()
        form_wins = (recent['FTR'] == 'A').sum()
        form_goals = recent['FTAG'].sum()
    
    return {
        'shots': shots if pd.notna(shots) else 12.0,
        'shots_on_target': shots_on_target if pd.notna(shots_on_target) else 5.0,
        'fouls': fouls if pd.notna(fouls) else 12.0,
        'corners': corners if pd.notna(corners) else 5.0,
        'yellows': yellows if pd.notna(yellows) else 1.5,
        'reds': reds if pd.notna(reds) else 0.05,
        'wins': int(wins),
        'goals_scored': goals_scored if pd.notna(goals_scored) else 1.3,
        'goals_conceded': goals_conceded if pd.notna(goals_conceded) else 1.2,
        'form_wins': int(form_wins),
        'form_goals': int(form_goals) if pd.notna(form_goals) else 5
    }

def prepare_match_features(home_team: str, away_team: str, season: str, team_encoding: Dict[str, int], feature_names: List[str]) -> pd.DataFrame:
    """
    Construct feature vector matching exported model feature names using REAL data.

    Model features: ['HomeTeam_le','AwayTeam_le','Season_encoded','HS','AS','HST','AST','HF','AF','HC','AC','HY','AY','HR','AR',
                     'home_wins_L5','home_goals_scored_L5','home_goals_conceded_L5','away_wins_L5','away_goals_scored_L5','away_goals_conceded_L5',
                     'home_shot_accuracy','away_shot_accuracy','home_discipline','away_discipline']
    """
    # Load real match data
    df = None
    if MATCHES_PATH.exists():
        try:
            df = load_matches_data()
        except Exception:
            df = None
    
    # Get real historical stats for both teams
    h = get_team_historical_stats(home_team, is_home=True, df=df)
    a = get_team_historical_stats(away_team, is_home=False, df=df)

    # Safe ratio helper
    def ratio(num, den):
        return 0.0 if den in (0, None) or pd.isna(den) else float(num) / float(den)

    # Build feature values matching model expectations
    feature_values = {
        'HomeTeam_le': team_encoding.get(home_team, 0),
        'AwayTeam_le': team_encoding.get(away_team, 1),
        'Season_encoded': 24,  # 2024-25 season encoding
        'HS': h['shots'],
        'AS': a['shots'],
        'HST': h['shots_on_target'],
        'AST': a['shots_on_target'],
        'HF': h['fouls'],
        'AF': a['fouls'],
        'HC': h['corners'],
        'AC': a['corners'],
        'HY': h['yellows'],
        'AY': a['yellows'],
        'HR': h['reds'],
        'AR': a['reds'],
        # L5 = Last 5 matches form features
        'home_wins_L5': h['form_wins'],
        'home_goals_scored_L5': h['form_goals'],
        'home_goals_conceded_L5': int(h['goals_conceded'] * 5),  # Approx last 5 conceded
        'away_wins_L5': a['form_wins'],
        'away_goals_scored_L5': a['form_goals'],
        'away_goals_conceded_L5': int(a['goals_conceded'] * 5),  # Approx last 5 conceded
        # Derived features
        'home_shot_accuracy': ratio(h['shots_on_target'], h['shots']),
        'away_shot_accuracy': ratio(a['shots_on_target'], a['shots']),
        'home_discipline': ratio(h['yellows'] + h['reds'], h['fouls']),
        'away_discipline': ratio(a['yellows'] + a['reds'], a['fouls']),
        # Legacy features (in case model expects them)
        'HS_per_Shots': ratio(h['shots_on_target'], h['shots']),
        'AS_per_Shots': ratio(a['shots_on_target'], a['shots']),
        'HF_per_Fouls': ratio(h['yellows'] + h['reds'], h['fouls']),
        'AF_per_Fouls': ratio(a['yellows'] + a['reds'], a['fouls']),
        'Home_Wins': h['wins'],
        'Away_Wins': a['wins'],
        'Home_Form': ratio(h['form_wins'], 10),
        'Away_Form': ratio(a['form_wins'], 10),
        'Home_Attack_Strength': h['goals_scored'],
        'Away_Attack_Strength': a['goals_scored']
    }

    # Ensure all model features present
    for fname in feature_names:
        if fname not in feature_values:
            feature_values[fname] = 0.0

    return pd.DataFrame([feature_values])[feature_names]

@router.post("/predict-match", response_model=MatchPredictionResponse)
async def predict_match_outcome(request: MatchPredictionRequest):
    """
    Predict outcome of a Premier League match
    
    **Model**: Random Forest Classifier (59.2% test accuracy, 40% real-world)
    
    **Strengths**: Home wins (60% accurate)
    
    **Weaknesses**: Draws (21% accurate), Away wins (27% accurate)
    
    **Input**: Home team, Away team
    
    **Output**: Prediction (Home Win/Draw/Away Win) + probabilities
    
    **Note**: Model has known limitations with draw and away win predictions
    """
    try:
        # Load model and encodings
        model_data = load_bo2()
        valid_teams = load_teams()
        team_encoding = load_team_encoding()
        
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        metadata = model_data.get('metadata', {})
        
        # Validate teams
        if request.home_team not in valid_teams:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid home team: '{request.home_team}'"
            )
        
        if request.away_team not in valid_teams:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid away team: '{request.away_team}'"
            )
        
        # Prepare features matching exported model
        X = prepare_match_features(request.home_team, request.away_team, request.season or '2024-25', team_encoding, feature_names)
        available_features = feature_names
        
        # Scale if scaler exists
        if scaler:
            X_scaled = scaler.transform(X)
        else:
            X_scaled = X.values
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        probabilities = model.predict_proba(X_scaled)[0]
        
        # Convert to labels
        outcome = get_outcome_label(prediction)
        confidence = calculate_match_confidence(probabilities.tolist())
        
        # Prepare probabilities response
        # Class order: [Away Win, Draw, Home Win]
        probs = MatchProbabilities(
            home_win=float(probabilities[2]) if len(probabilities) > 2 else 0.33,
            draw=float(probabilities[1]) if len(probabilities) > 1 else 0.33,
            away_win=float(probabilities[0]) if len(probabilities) > 0 else 0.33
        )
        
        # Expert mode: Add feature importance
        feature_importance = None
        model_accuracy = None
        
        if request.expert_mode:
            # Get feature importances from Random Forest
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_values = X.iloc[0].to_dict()
                
                # Create list of feature importance
                feat_imp_list = []
                for feat, imp in zip(available_features, importances):
                    if imp > 0.01:  # Only show important features
                        feat_imp_list.append(
                            FeatureImportance(
                                feature=feat,
                                value=feature_values.get(feat, 0),
                                importance=round(float(imp), 3)
                            )
                        )
                
                # Sort by importance
                feat_imp_list.sort(key=lambda x: x.importance, reverse=True)
                feature_importance = feat_imp_list[:10]  # Top 10
            
            model_accuracy = metadata.get('accuracy', 0.592)
        
        response = MatchPredictionResponse(
            prediction=outcome,
            probabilities=probs,
            confidence=confidence,
            feature_importance=feature_importance,
            model_accuracy=model_accuracy
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Match prediction failed: {str(e)}"
        )

@router.get("/model-info/bo2")
async def get_bo2_model_info():
    """Get BO2 model information"""
    try:
        model_data = load_bo2()
        metadata = model_data.get('metadata', {})
        
        return {
            "business_objective": "Match Outcome Prediction",
            "algorithm": metadata.get('algorithm', 'Random Forest Classifier'),
            "features": model_data['features'],
            "performance": {
                "test_accuracy": metadata.get('accuracy', 0.592),
                "real_world_accuracy": 0.40,
                "home_win_accuracy": 0.60,
                "draw_accuracy": 0.21,
                "away_win_accuracy": 0.27
            },
            "limitations": [
                "Poor draw prediction (21% accuracy)",
                "Weak away win prediction (27% accuracy)",
                "Home bias in predictions"
            ],
            "version": metadata.get('version')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )
