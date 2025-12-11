"""
BO4: Player Recommendations Endpoint
Recommends top rising stars per position using LightGBM models
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
import pandas as pd
import numpy as np
import os

from app.schemas.responses import PlayerRecommendationsResponse, PlayerRecommendation
from app.core.model_loader import load_bo4, load_teams

router = APIRouter()

# Path to real player dataset
PLAYERS_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'players_24-25.csv')

def load_player_data() -> pd.DataFrame:
    """Load real player data from CSV dataset"""
    if not os.path.exists(PLAYERS_DATA_PATH):
        raise FileNotFoundError(f"Players dataset not found at {PLAYERS_DATA_PATH}")
    return pd.read_csv(PLAYERS_DATA_PATH)

def get_player_data_from_dataset(position: str, max_age: int, min_minutes: int) -> pd.DataFrame:
    """
    Get player data from real dataset filtered by position and constraints.
    Includes players from ALL top 5 European leagues for transfer recommendations.
    """
    df = load_player_data()
    
    position_lower = position.lower()
    
    # Map position to dataset values
    pos_map = {
        'forward': 'FW',
        'midfielder': 'MF',
        'defender': 'DF',
        'goalkeeper': 'GK'
    }
    
    pos_code = pos_map.get(position_lower)
    if not pos_code:
        return pd.DataFrame()
    
    # Filter by position (Pos column may contain multiple like "DF,MF")
    df = df[df['Pos'].str.contains(pos_code, na=False)]
    
    # Filter by age
    if max_age:
        df = df[df['Age'].notna() & (df['Age'] <= max_age)]
    
    # Filter by minutes played
    if min_minutes:
        df = df[df['Min'].notna() & (df['Min'] >= min_minutes)]
    
    # Include ALL top 5 leagues for transfer market recommendations
    # Premier League, La Liga, Bundesliga, Serie A, Ligue 1
    top_leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1']
    df = df[df['Comp'].str.contains('|'.join(top_leagues), na=False, case=False)]
    
    # Compute derived features needed by the model
    # Ensure 90s is numeric
    df['90s'] = pd.to_numeric(df['90s'], errors='coerce').fillna(0)
    
    # Goals and assists per 90
    df['Goals_per_90'] = np.where(df['90s'] > 0, df['Gls'].fillna(0) / df['90s'], 0)
    df['Assists_per_90'] = np.where(df['90s'] > 0, df['Ast'].fillna(0) / df['90s'], 0)
    
    # Productivity Score = Goals + Assists per 90
    df['Productivity_Score'] = df['Goals_per_90'] + df['Assists_per_90']
    
    # Shots on Target percentage
    df['Sh'] = pd.to_numeric(df['Sh'], errors='coerce').fillna(0)
    df['SoT'] = pd.to_numeric(df['SoT'], errors='coerce').fillna(0)
    df['Shots_on_Target_pct'] = np.where(df['Sh'] > 0, df['SoT'] / df['Sh'] * 100, 0)
    
    # Pass completion percentage (already in data as Cmp%)
    df['Pass_Completion_pct'] = pd.to_numeric(df['Cmp%'], errors='coerce').fillna(0)
    
    # Tackles and interceptions per 90
    df['Tkl'] = pd.to_numeric(df['Tkl'], errors='coerce').fillna(0)
    df['Int'] = pd.to_numeric(df['Int'], errors='coerce').fillna(0)
    df['Tackles_per_90'] = np.where(df['90s'] > 0, df['Tkl'] / df['90s'], 0)
    df['Interceptions_per_90'] = np.where(df['90s'] > 0, df['Int'] / df['90s'], 0)
    
    # G/Sh - Goals per shot
    df['G/Sh'] = pd.to_numeric(df['G/Sh'], errors='coerce').fillna(0)
    
    # Goalkeeper stats
    if 'GA90' in df.columns:
        df['GA90'] = pd.to_numeric(df['GA90'], errors='coerce').fillna(0)
    else:
        df['GA90'] = 0
        
    if 'Save%' in df.columns:
        df['Save%'] = pd.to_numeric(df['Save%'], errors='coerce').fillna(0)
    else:
        df['Save%'] = 0
        
    if 'Saves' in df.columns:
        df['Saves'] = pd.to_numeric(df['Saves'], errors='coerce').fillna(0)
    else:
        df['Saves'] = 0
        
    if 'CS%' in df.columns:
        df['CS%'] = pd.to_numeric(df['CS%'], errors='coerce').fillna(0)
    else:
        df['CS%'] = 0
        
    if 'PSxG' in df.columns:
        df['PSxG'] = pd.to_numeric(df['PSxG'], errors='coerce').fillna(0)
    else:
        df['PSxG'] = 0
    
    # Key passes
    if 'KP' in df.columns:
        df['KP'] = pd.to_numeric(df['KP'], errors='coerce').fillna(0)
    else:
        df['KP'] = 0
    
    # Progressive passes and carries
    df['PrgP'] = pd.to_numeric(df['PrgP'], errors='coerce').fillna(0)
    df['PrgC'] = pd.to_numeric(df['PrgC'], errors='coerce').fillna(0)
    
    # Clearances
    if 'Clr' in df.columns:
        df['Clr'] = pd.to_numeric(df['Clr'], errors='coerce').fillna(0)
    else:
        df['Clr'] = 0
    
    # Market value - handle NaN
    df['Market_Value'] = pd.to_numeric(df['Market_Value'], errors='coerce').fillna(0)
    
    # Min as numeric
    df['Min'] = pd.to_numeric(df['Min'], errors='coerce').fillna(0)
    
    # Age as numeric
    df['Age'] = pd.to_numeric(df['Age'], errors='coerce').fillna(0)
    
    # DEDUPLICATE: Keep only the best appearance per player (by minutes played)
    # Some players appear in multiple leagues due to transfers
    df = df.sort_values('Min', ascending=False).drop_duplicates(subset=['Player'], keep='first')
    
    return df

def prepare_player_features(df: pd.DataFrame, feature_names: list) -> pd.DataFrame:
    """
    Prepare features for LightGBM model.
    Returns DataFrame with exact columns the model expects.
    """
    feature_df = pd.DataFrame(index=df.index)
    
    for feature in feature_names:
        if feature in df.columns:
            feature_df[feature] = pd.to_numeric(df[feature], errors='coerce').fillna(0)
        else:
            # Handle missing columns with zeros
            feature_df[feature] = 0
            
    return feature_df[feature_names]


@router.get("/players/recommendations", response_model=PlayerRecommendationsResponse)
async def get_player_recommendations(
    position: str = Query(..., description="Player position (defender/midfielder/forward/goalkeeper)"),
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations"),
    max_age: Optional[int] = Query(None, ge=16, le=40, description="Maximum age"),
    min_minutes: int = Query(90, ge=0, description="Minimum minutes played")
):
    """
    Get top player recommendations for a specific position
    
    **Model**: LightGBM Regressor (4 models - one per position)
    """
    try:
        # Validate position
        valid_positions = ['defender', 'midfielder', 'forward', 'goalkeeper']
        position_lower = position.lower()
        
        if position_lower not in valid_positions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid position: '{position}'. Must be one of: {', '.join(valid_positions)}"
            )
        
        # Set default max_age based on position
        if max_age is None:
            max_age = 26 if position_lower == 'goalkeeper' else 23
        
        # Load position-specific model
        model_data = load_bo4(position_lower)
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        
        # Get player data from REAL dataset
        players_df = get_player_data_from_dataset(position_lower, max_age, min_minutes)
        
        if players_df.empty:
            return PlayerRecommendationsResponse(
                position=position_lower,
                filters={
                    "max_age": max_age,
                    "min_minutes": min_minutes,
                    "limit": limit
                },
                recommendations=[]
            )
        
        # Prepare features for prediction
        X = prepare_player_features(players_df, feature_names)
        
        # Scale if scaler exists
        if scaler:
            X_scaled = scaler.transform(X.values)
        else:
            X_scaled = X.values
        
        # Predict performance scores
        predictions = model.predict(X_scaled)
        
        # Store raw predictions (don't normalize - use raw model output)
        players_df['predicted_score'] = predictions
        
        # Rank by predicted score (primary) and Market_Value (secondary tiebreaker)
        # This ensures consistent ordering when scores are equal
        players_df_sorted = players_df.sort_values(
            by=['predicted_score', 'Market_Value'], 
            ascending=[False, False]
        )
        top_players = players_df_sorted.head(limit)
        
        # Build recommendations from REAL player data
        recommendations = []
        for rank, (idx, row) in enumerate(top_players.iterrows(), start=1):
            # Build position-specific stats dict
            stats_dict = {}
            
            # Forward stats
            if position_lower == 'forward':
                stats_dict = {
                    'Goals/90': round(float(row.get('Goals_per_90', 0)), 2),
                    'Assists/90': round(float(row.get('Assists_per_90', 0)), 2),
                    'Shots': int(row.get('Sh', 0)),
                    'Shots on Target': int(row.get('SoT', 0)),
                    'Shot Accuracy': f"{round(float(row.get('Shots_on_Target_pct', 0)), 1)}%",
                    'xG': round(float(row.get('xG', 0)), 2),
                    'Progressive Carries': int(row.get('PrgC', 0)),
                }
            # Midfielder stats
            elif position_lower == 'midfielder':
                stats_dict = {
                    'Goals/90': round(float(row.get('Goals_per_90', 0)), 2),
                    'Assists/90': round(float(row.get('Assists_per_90', 0)), 2),
                    'Pass Completion': f"{round(float(row.get('Pass_Completion_pct', 0)), 1)}%",
                    'Key Passes': int(row.get('KP', 0)),
                    'Progressive Passes': int(row.get('PrgP', 0)),
                    'Tackles/90': round(float(row.get('Tackles_per_90', 0)), 2),
                    'Interceptions/90': round(float(row.get('Interceptions_per_90', 0)), 2),
                }
            # Defender stats
            elif position_lower == 'defender':
                stats_dict = {
                    'Tackles': int(row.get('Tkl', 0)),
                    'Tackles/90': round(float(row.get('Tackles_per_90', 0)), 2),
                    'Interceptions': int(row.get('Int', 0)),
                    'Interceptions/90': round(float(row.get('Interceptions_per_90', 0)), 2),
                    'Clearances': int(row.get('Clr', 0)),
                    'Pass Completion': f"{round(float(row.get('Pass_Completion_pct', 0)), 1)}%",
                    'Goals/90': round(float(row.get('Goals_per_90', 0)), 2),
                }
            # Goalkeeper stats
            elif position_lower == 'goalkeeper':
                stats_dict = {
                    'Goals Against/90': round(float(row.get('GA90', 0)), 2),
                    'Save %': f"{round(float(row.get('Save%', 0)), 1)}%",
                    'Saves': int(row.get('Saves', 0)),
                    'Clean Sheet %': f"{round(float(row.get('CS%', 0)), 1)}%",
                    'PSxG': round(float(row.get('PSxG', 0)), 2),
                }
            
            # Add common stats
            stats_dict['Minutes'] = int(row.get('Min', 0))
            stats_dict['90s Played'] = round(float(row.get('90s', 0)), 1)
            
            # Get league name (clean up the format)
            league_raw = str(row.get('Comp', 'Unknown'))
            # Remove country code prefix like "eng ", "es ", etc.
            league = league_raw.split(' ', 1)[-1] if ' ' in league_raw else league_raw
            
            recommendations.append(
                PlayerRecommendation(
                    rank=rank,
                    player=str(row.get('Player', 'Unknown')),
                    squad=str(row.get('Squad', 'Unknown')),
                    league=league,
                    age=int(row.get('Age', 0)),
                    market_value=float(row.get('Market_Value', 0)),
                    predicted_score=round(float(row['predicted_score']), 3),
                    stats=stats_dict
                )
            )
        
        return PlayerRecommendationsResponse(
            position=position_lower,
            filters={
                "max_age": max_age,
                "min_minutes": min_minutes,
                "limit": limit
            },
            recommendations=recommendations
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Player recommendations failed: {str(e)}"
        )


@router.get("/players/positions")
async def get_available_positions():
    """Get list of available player positions"""
    return {
        "positions": [
            {
                "name": "Forward",
                "max_age_default": 23,
                "description": "Strikers and wingers"
            },
            {
                "name": "Midfielder",
                "max_age_default": 23,
                "description": "Central and attacking midfielders"
            },
            {
                "name": "Defender",
                "max_age_default": 23,
                "description": "Center-backs and full-backs"
            },
            {
                "name": "Goalkeeper",
                "max_age_default": 26,
                "description": "Goalkeepers"
            }
        ]
    }


@router.get("/model-info/bo4")
async def get_bo4_model_info(position: str = Query(..., description="Position to get model info for")):
    """Get BO4 model information for a specific position"""
    try:
        valid_positions = ['defender', 'midfielder', 'forward', 'goalkeeper']
        position_lower = position.lower()
        
        if position_lower not in valid_positions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid position. Must be one of: {', '.join(valid_positions)}"
            )
        
        model_data = load_bo4(position_lower)
        metadata = model_data.get('metadata', {})
        
        return {
            "business_objective": "Player Recommendations",
            "position": position_lower,
            "algorithm": metadata.get('algorithm', 'LightGBM Regressor'),
            "features": model_data['features'],
            "filters": {
                "max_age": 26 if position_lower == 'goalkeeper' else 23,
                "min_minutes": 90
            },
            "performance": metadata.get('performance', {}),
            "version": metadata.get('version')
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )
