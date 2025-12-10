"""
BO1: Season Ranking Prediction Endpoint
Predicts final league positions (1-20) for all teams using KNN Regressor
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
import pandas as pd
import numpy as np
from pathlib import Path

from app.schemas.requests import SeasonRankingRequest, TeamStats
from app.schemas.responses import SeasonRankingResponse, TeamPrediction, ModelMetadata
from app.core.model_loader import load_bo1, load_teams
from app.core.preprocessing import prepare_season_ranking_features, assign_confidence_level

router = APIRouter()

# Path to real team season data
TEAM_SEASON_PATH = Path(__file__).parent.parent / 'data' / 'processed' / 'team_season_aggregated.csv'

def load_team_season_data() -> pd.DataFrame:
    """Load real team season aggregated data from CSV"""
    if not TEAM_SEASON_PATH.exists():
        raise FileNotFoundError(f"Team season dataset not found at {TEAM_SEASON_PATH}")
    return pd.read_csv(TEAM_SEASON_PATH)

def get_available_seasons() -> List[str]:
    """Get list of all available seasons in the dataset"""
    df = load_team_season_data()
    return sorted(df['Season'].unique().tolist(), reverse=True)

def get_team_stats_for_season(season: str) -> List[dict]:
    """
    Get real team statistics for a given season from the dataset.
    Returns list of team stats dictionaries.
    """
    df = load_team_season_data()
    season_df = df[df['Season'] == season]
    
    if season_df.empty:
        raise ValueError(f"No data found for season {season}")
    
    team_stats = []
    for _, row in season_df.iterrows():
        # Use Clean_Sheet_Rate directly from dataset if available, else calculate
        clean_sheet_rate = row.get('Clean_Sheet_Rate', 0)
        if pd.isna(clean_sheet_rate):
            clean_sheets = int(row.get('Clean_Sheets', 0)) if pd.notna(row.get('Clean_Sheets')) else 0
            matches = int(row.get('Matches_Played', 38)) if pd.notna(row.get('Matches_Played')) else 38
            clean_sheet_rate = clean_sheets / matches if matches > 0 else 0
        
        team_stats.append({
            'team': row['Team'],
            'wins': int(row['Wins']) if pd.notna(row['Wins']) else 0,
            'draws': int(row['Draws']) if pd.notna(row['Draws']) else 0,
            'losses': int(row['Losses']) if pd.notna(row['Losses']) else 0,
            'goals_scored': int(row['Goals_Scored']) if pd.notna(row['Goals_Scored']) else 0,
            'goals_conceded': int(row['Goals_Conceded']) if pd.notna(row['Goals_Conceded']) else 0,
            'clean_sheets': int(row['Clean_Sheets']) if pd.notna(row.get('Clean_Sheets')) else 0,
            'win_rate': float(row['Win_Rate']) if pd.notna(row.get('Win_Rate')) else 0,
            'clean_sheet_rate': float(clean_sheet_rate),
            'actual_position': int(row['Final_Position']) if pd.notna(row.get('Final_Position')) else None
        })
    
    return team_stats

@router.get("/seasons")
async def get_seasons():
    """Get list of available seasons for prediction"""
    try:
        seasons = get_available_seasons()
        return {
            "seasons": seasons,
            "default": seasons[0] if seasons else "2024-25"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load seasons: {str(e)}"
        )


@router.get("/forecast-next-season")
async def forecast_next_season():
    """
    Forecast the next Premier League season standings.
    
    Uses the latest available season's current standings as input to predict next season.
    
    **Model**: KNN Regressor (uses historical trends and current performance)
    
    **Output**: Predicted final positions for next season (1-20)
    """
    try:
        # Get latest season data
        seasons = get_available_seasons()
        if not seasons:
            raise ValueError("No season data available")
        
        latest_season = seasons[0]
        team_stats_list = get_team_stats_for_season(latest_season)
        
        # Load model
        model_data = load_bo1()
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        metadata = model_data.get('metadata', {})
        
        # Prepare features and predict for each team
        predictions_list = []
        
        for team_stat in team_stats_list:
            # Engineer features from current season stats
            features = prepare_season_ranking_features(team_stat)
            
            # Get feature names from scaler if available
            if scaler and hasattr(scaler, 'feature_names_in_'):
                actual_features = scaler.feature_names_in_.tolist()
            else:
                actual_features = feature_names
            
            # Add any missing features
            for feat in actual_features:
                if feat not in features:
                    if feat == 'Clean_Sheets':
                        features[feat] = team_stat.get('clean_sheets', 0)
            
            # Create DataFrame with correct feature order
            X = pd.DataFrame([features])[actual_features]
            
            # Scale if scaler exists
            if scaler:
                X_scaled = scaler.transform(X)
            else:
                X_scaled = X.values
            
            # Predict position
            predicted_position = model.predict(X_scaled)[0]
            predicted_position = np.clip(predicted_position, 1, 20)
            
            predictions_list.append({
                'team': team_stat['team'],
                'predicted_position': float(predicted_position)
            })
        
        # Sort by predicted position and assign ranks
        predictions_list.sort(key=lambda x: x['predicted_position'])
        
        ranked_predictions = []
        for rank, pred in enumerate(predictions_list, start=1):
            mae = metadata.get('mae', 1.15)
            confidence = assign_confidence_level(mae, pred['predicted_position'])
            
            ranked_predictions.append({
                "rank": rank,
                "team": pred['team'],
                "predicted_position": rank,
                "raw_prediction": round(pred['predicted_position'], 2),
                "confidence": confidence
            })
        
        # Determine next season year
        current_year = int(latest_season.split('-')[0])
        next_season = f"{current_year + 1}-{current_year + 2}"
        
        return {
            "season": next_season,
            "based_on_season": latest_season,
            "predictions": ranked_predictions,
            "model_metadata": {
                "algorithm": metadata.get('algorithm', 'KNN Regressor'),
                "mae": metadata.get('mae'),
                "r2_score": metadata.get('r2_score'),
                "note": "Forecast based on current season performance trends"
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast failed: {str(e)}"
        )


@router.get("/forecast-2025-26")
async def forecast_2025_26():
    """
    Forecast 2025-26 Premier League season standings.
    
    Uses current 2024-25 season standings (as of December 2025) to predict final 2025-26 positions.
    
    **Model**: KNN Regressor
    
    **Output**: Predicted final positions for 2025-26 season
    """
    try:
        # Current 2024-25 standings (Dec 10, 2025 - 15 matches played)
        current_standings = [
            {"team": "Arsenal", "wins": 10, "draws": 3, "losses": 2, "goals_scored": 28, "goals_conceded": 9, "clean_sheets": 5},
            {"team": "Man City", "wins": 10, "draws": 1, "losses": 4, "goals_scored": 35, "goals_conceded": 16, "clean_sheets": 3},
            {"team": "Aston Villa", "wins": 9, "draws": 3, "losses": 3, "goals_scored": 22, "goals_conceded": 15, "clean_sheets": 4},
            {"team": "Crystal Palace", "wins": 7, "draws": 5, "losses": 3, "goals_scored": 20, "goals_conceded": 12, "clean_sheets": 3},
            {"team": "Chelsea", "wins": 7, "draws": 4, "losses": 4, "goals_scored": 25, "goals_conceded": 15, "clean_sheets": 2},
            {"team": "Man United", "wins": 7, "draws": 4, "losses": 4, "goals_scored": 26, "goals_conceded": 22, "clean_sheets": 2},
            {"team": "Everton", "wins": 7, "draws": 3, "losses": 5, "goals_scored": 18, "goals_conceded": 17, "clean_sheets": 2},
            {"team": "Brighton", "wins": 6, "draws": 5, "losses": 4, "goals_scored": 25, "goals_conceded": 21, "clean_sheets": 2},
            {"team": "Sunderland", "wins": 6, "draws": 5, "losses": 4, "goals_scored": 18, "goals_conceded": 17, "clean_sheets": 2},
            {"team": "Liverpool", "wins": 7, "draws": 2, "losses": 6, "goals_scored": 24, "goals_conceded": 24, "clean_sheets": 2},
            {"team": "Tottenham", "wins": 6, "draws": 4, "losses": 5, "goals_scored": 25, "goals_conceded": 18, "clean_sheets": 2},
            {"team": "Newcastle", "wins": 6, "draws": 4, "losses": 5, "goals_scored": 21, "goals_conceded": 19, "clean_sheets": 2},
            {"team": "Bournemouth", "wins": 5, "draws": 5, "losses": 5, "goals_scored": 21, "goals_conceded": 24, "clean_sheets": 1},
            {"team": "Brentford", "wins": 6, "draws": 1, "losses": 8, "goals_scored": 21, "goals_conceded": 24, "clean_sheets": 1},
            {"team": "Fulham", "wins": 5, "draws": 2, "losses": 8, "goals_scored": 20, "goals_conceded": 24, "clean_sheets": 1},
            {"team": "Leeds United", "wins": 4, "draws": 3, "losses": 8, "goals_scored": 19, "goals_conceded": 29, "clean_sheets": 1},
            {"team": "Nottm Forest", "wins": 4, "draws": 3, "losses": 8, "goals_scored": 14, "goals_conceded": 25, "clean_sheets": 1},
            {"team": "West Ham", "wins": 3, "draws": 4, "losses": 8, "goals_scored": 17, "goals_conceded": 29, "clean_sheets": 1},
            {"team": "Burnley", "wins": 3, "draws": 1, "losses": 11, "goals_scored": 16, "goals_conceded": 30, "clean_sheets": 0},
            {"team": "Wolves", "wins": 0, "draws": 2, "losses": 13, "goals_scored": 8, "goals_conceded": 33, "clean_sheets": 0},
        ]
        
        # Load model
        model_data = load_bo1()
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        metadata = model_data.get('metadata', {})
        
        # Prepare features and predict for each team
        predictions_list = []
        
        for team_stat in current_standings:
            # Engineer features from current season stats
            features = prepare_season_ranking_features(team_stat)
            
            # Get feature names from scaler if available
            if scaler and hasattr(scaler, 'feature_names_in_'):
                actual_features = scaler.feature_names_in_.tolist()
            else:
                actual_features = feature_names
            
            # Add any missing features
            for feat in actual_features:
                if feat not in features:
                    if feat == 'Clean_Sheets':
                        features[feat] = team_stat.get('clean_sheets', 0)
            
            # Create DataFrame with correct feature order
            X = pd.DataFrame([features])[actual_features]
            
            # Scale if scaler exists
            if scaler:
                X_scaled = scaler.transform(X)
            else:
                X_scaled = X.values
            
            # Predict position
            predicted_position = model.predict(X_scaled)[0]
            predicted_position = np.clip(predicted_position, 1, 20)
            
            predictions_list.append({
                'team': team_stat['team'],
                'predicted_position': float(predicted_position)
            })
        
        # Sort by predicted position and assign ranks
        predictions_list.sort(key=lambda x: x['predicted_position'])
        
        ranked_predictions = []
        for rank, pred in enumerate(predictions_list, start=1):
            mae = metadata.get('mae', 1.15)
            confidence = assign_confidence_level(mae, pred['predicted_position'])
            
            ranked_predictions.append({
                "rank": rank,
                "team": pred['team'],
                "predicted_position": rank,
                "raw_prediction": round(pred['predicted_position'], 2),
                "confidence": confidence
            })
        
        return {
            "season": "2025-26",
            "based_on_season": "2024-25 (15 matches)",
            "predictions": ranked_predictions,
            "model_metadata": {
                "algorithm": metadata.get('algorithm', 'KNN Regressor'),
                "mae": metadata.get('mae'),
                "r2_score": metadata.get('r2_score'),
                "note": "Forecast based on current 2024-25 season standings (December 10, 2025)"
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast failed: {str(e)}"
        )

@router.get("/predict-season/{season}")
async def predict_season_from_data(
    season: str,
    compare_actual: bool = Query(False, description="Compare with actual final positions")
):
    """
    Predict final season standings using REAL historical data.
    
    **Model**: KNN Regressor (MAE ~1.15, R² ~0.938)
    
    **Input**: Season (e.g., '2023-24', '2022-23')
    
    **Output**: Predicted final positions (1-20) with confidence levels
    
    **Note**: For past seasons, can compare predictions vs actual results
    """
    try:
        # Load model
        model_data = load_bo1()
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        metadata = model_data.get('metadata', {})
        
        # Get real team stats for the season
        team_stats_list = get_team_stats_for_season(season)
        
        # Prepare features and predict for each team
        predictions_list = []
        
        for team_stat in team_stats_list:
            # Engineer features
            features = prepare_season_ranking_features(team_stat)
            
            # Get feature names from scaler if available (it may have more features than listed)
            if scaler and hasattr(scaler, 'feature_names_in_'):
                actual_features = scaler.feature_names_in_.tolist()
            else:
                actual_features = feature_names
            
            # Add any missing features the scaler expects
            for feat in actual_features:
                if feat not in features:
                    # Map to available data
                    if feat == 'Clean_Sheets':
                        features[feat] = team_stat.get('clean_sheets', 0)
            
            # Create DataFrame with correct feature order
            X = pd.DataFrame([features])[actual_features]
            
            # Scale if scaler exists
            if scaler:
                X_scaled = scaler.transform(X)
            else:
                X_scaled = X.values
            
            # Predict position
            predicted_position = model.predict(X_scaled)[0]
            
            # Ensure position is within 1-20
            predicted_position = np.clip(predicted_position, 1, 20)
            
            predictions_list.append({
                'team': team_stat['team'],
                'predicted_position': float(predicted_position),
                'actual_position': team_stat.get('actual_position'),
                'stats': features
            })
        
        # Sort by predicted position and assign ranks
        predictions_list.sort(key=lambda x: x['predicted_position'])
        
        ranked_predictions = []
        for rank, pred in enumerate(predictions_list, start=1):
            mae = metadata.get('mae', 1.15)
            confidence = assign_confidence_level(mae, pred['predicted_position'])
            
            prediction_data = {
                "rank": rank,
                "team": pred['team'],
                "predicted_position": rank,  # Display clean rank for users
                "raw_prediction": round(pred['predicted_position'], 2),  # Raw model output for expert mode
                "confidence": confidence
            }
            
            # Add actual position for comparison if available and requested
            if compare_actual and pred['actual_position'] is not None:
                prediction_data["actual_position"] = pred['actual_position']
                prediction_data["position_diff"] = abs(rank - pred['actual_position'])
            
            ranked_predictions.append(prediction_data)
        
        response = {
            "season": season,
            "predictions": ranked_predictions,
            "model_metadata": {
                "algorithm": metadata.get('algorithm', 'KNN Regressor'),
                "mae": metadata.get('mae'),
                "r2_score": metadata.get('r2_score'),
                "version": metadata.get('version')
            }
        }
        
        # Add accuracy stats if comparing
        if compare_actual:
            diffs = [p.get('position_diff', 0) for p in ranked_predictions if 'position_diff' in p]
            if diffs:
                response["comparison"] = {
                    "avg_position_error": round(sum(diffs) / len(diffs), 2),
                    "exact_matches": sum(1 for d in diffs if d == 0),
                    "within_1": sum(1 for d in diffs if d <= 1),
                    "within_3": sum(1 for d in diffs if d <= 3)
                }
        
        return response
    
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict-season", response_model=SeasonRankingResponse)
async def predict_season_ranking(request: SeasonRankingRequest):
    """
    Predict final season standings for Premier League teams
    
    **Model**: KNN Regressor (MAE ~1.15, R² ~0.938)
    
    **Input**: Team statistics (wins, draws, losses, goals, clean sheets, etc.)
    
    **Output**: Predicted final positions (1-20) with confidence levels
    """
    try:
        # Load model and teams
        model_data = load_bo1()
        valid_teams = load_teams()
        
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        metadata = model_data.get('metadata', {})
        
        # Validate teams
        for team_stat in request.teams:
            if team_stat.team not in valid_teams:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid team name: '{team_stat.team}'. Must be one of: {', '.join(valid_teams)}"
                )
        
        # Prepare features for each team
        predictions_list = []
        
        for team_stat in request.teams:
            # Engineer features
            features = prepare_season_ranking_features(team_stat.dict())
            
            # Create DataFrame with correct feature order
            X = pd.DataFrame([features])[feature_names]
            
            # Scale if scaler exists
            if scaler:
                X_scaled = scaler.transform(X)
            else:
                X_scaled = X.values
            
            # Predict position
            predicted_position = model.predict(X_scaled)[0]
            
            # Ensure position is within 1-20
            predicted_position = np.clip(predicted_position, 1, 20)
            
            predictions_list.append({
                'team': team_stat.team,
                'predicted_position': float(predicted_position),
                'stats': features
            })
        
        # Sort by predicted position and assign ranks
        predictions_list.sort(key=lambda x: x['predicted_position'])
        
        ranked_predictions = []
        for rank, pred in enumerate(predictions_list, start=1):
            mae = metadata.get('mae', 1.15)
            confidence = assign_confidence_level(mae, pred['predicted_position'])
            
            ranked_predictions.append(
                TeamPrediction(
                    rank=rank,
                    team=pred['team'],
                    predicted_position=round(pred['predicted_position'], 2),
                    confidence=confidence
                )
            )
        
        # Build response
        response = SeasonRankingResponse(
            season=request.season,
            predictions=ranked_predictions,
            model_metadata=ModelMetadata(
                algorithm=metadata.get('algorithm', 'KNN Regressor'),
                mae=metadata.get('mae'),
                r2_score=metadata.get('r2_score'),
                accuracy=metadata.get('accuracy'),
                version=metadata.get('version')
            )
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/model-info/bo1")
async def get_bo1_model_info():
    """Get BO1 model information and required features"""
    try:
        model_data = load_bo1()
        return {
            "business_objective": "Season Ranking Prediction",
            "algorithm": model_data['metadata'].get('algorithm', 'KNN Regressor'),
            "features": model_data['features'],
            "performance": {
                "mae": model_data['metadata'].get('mae'),
                "r2_score": model_data['metadata'].get('r2_score'),
                "description": "60% of predictions within ±1 position"
            },
            "version": model_data['metadata'].get('version')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )
