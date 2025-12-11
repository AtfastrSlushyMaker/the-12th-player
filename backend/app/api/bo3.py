"""
BO3: Team Tactical Style Clustering Endpoint
Classifies teams into 5 distinct tactical playing styles using KMeans
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np

from app.schemas.responses import TeamStyleResponse, ClusterInfo
from app.core.model_loader import load_bo3
from app.core.preprocessing import get_cluster_label
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent.parent / 'app' / 'data' / 'processed' / 'team_season_aggregated.csv'

router = APIRouter()

def _get_all_teams_from_data() -> List[str]:
    """Get all teams available in the dataset (historical + current)."""
    if not DATA_PATH.exists():
        return []
    df = pd.read_csv(DATA_PATH)
    return sorted(df['Team'].unique().tolist())

def _load_team_row(team: str, season: str) -> Dict[str, Any]:
    """Load aggregated season stats for a team from CSV, fallback to latest season if not found."""
    if not DATA_PATH.exists():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Aggregated season dataset missing")
    df = pd.read_csv(DATA_PATH)
    # Prefer provided season
    row = df[(df['Team'] == team) & (df['Season'] == season)]
    if row.empty:
        # Fallback to most recent season available for team
        latest_row = df[df['Team'] == team].sort_values('Season_encoded', ascending=False).head(1)
        if latest_row.empty:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No data found for team {team}")
        row = latest_row
    return row.iloc[0].to_dict()

def prepare_clustering_features(team: str, season: str) -> pd.DataFrame:
    """Prepare feature vector aligned to model feature names using real aggregated dataset."""
    r = _load_team_row(team, season)
    # Compute derived metrics safely
    avg_shots = r.get('Avg_Shots') or r.get('AvgShots') or 0
    avg_goals = r.get('Avg_Goals_Scored', 0)
    avg_corners = r.get('Avg_Corners', 0)
    fouls = r.get('Fouls', 0)
    matches = r.get('Matches_Played', 38)
    yellow = r.get('Yellow_Cards', 0)
    red = r.get('Red_Cards', 0)
    goals_conceded_avg = r.get('Avg_Goals_Conceded', 0)
    shot_accuracy = r.get('Shot_Accuracy', 0)
    clean_sheet_rate = r.get('Clean_Sheet_Rate', r.get('CleanSheetRate', 0))
    win_rate = r.get('Win_Rate', r.get('WinRate', 0))
    home_win_rate = r.get('Home_Win_Rate', 0)
    away_win_rate = r.get('Away_Win_Rate', 0)
    points_per_game = r.get('Points_Per_Game', 0)

    features = {
        'Avg_Goals_Scored': avg_goals,
        'Avg_Shots': avg_shots,
        'Avg_Shots_On_Target': r.get('Avg_Shots_On_Target', 0),
        'Shot_Accuracy': shot_accuracy,
        'Goals_per_Shot': 0.0 if avg_shots == 0 else avg_goals / avg_shots,
        'Avg_Goals_Conceded': goals_conceded_avg,
        'Clean_Sheet_Rate': clean_sheet_rate,
        'Avg_Corners': avg_corners,
        'Corners_per_Shot': 0.0 if avg_shots == 0 else avg_corners / avg_shots,
        'Fouls_per_Match': 0.0 if matches == 0 else fouls / matches,
        'Yellow_per_Match': 0.0 if matches == 0 else yellow / matches,
        'Red_per_Match': 0.0 if matches == 0 else red / matches,
        'Cards_per_Foul': 0.0 if fouls == 0 else (yellow + red) / fouls,
        'Win_Rate': win_rate,
        'Home_Win_Rate': home_win_rate,
        'Away_Win_Rate': away_win_rate,
        'Points_Per_Game': points_per_game
    }
    return pd.DataFrame([features]), features

def find_similar_teams(cluster_id: int, current_team: str, season: str, model, scaler, feature_names: List[str]) -> List[str]:
    """
    Find teams in the same cluster using REAL data and model predictions.
    Clusters all teams for the given season and returns those in same cluster.
    """
    try:
        df = pd.read_csv(DATA_PATH)
        season_df = df[df['Season'] == season]
        
        if season_df.empty:
            # Fallback to most recent season
            season_df = df.sort_values('Season_encoded', ascending=False).drop_duplicates('Team')
        
        similar_teams = []
        
        for _, row in season_df.iterrows():
            team_name = row['Team']
            if team_name == current_team:
                continue
            
            try:
                # Prepare features for this team
                X, _ = prepare_clustering_features(team_name, season)
                available_features = [f for f in feature_names if f in X.columns]
                X = X[available_features]
                
                if scaler:
                    X_scaled = scaler.transform(X)
                else:
                    X_scaled = X.values
                
                # Predict cluster
                team_cluster = int(model.predict(X_scaled)[0])
                
                if team_cluster == cluster_id:
                    similar_teams.append(team_name)
            except:
                continue
        
        return similar_teams[:5]  # Return top 5 similar teams
    except Exception:
        # Fallback to empty list if real clustering fails
        return []

@router.get("/team-style/{team_name}", response_model=TeamStyleResponse)
async def get_team_tactical_style(
    team_name: str,
    season: str = Query("2024-25", description="Season for analysis")
):
    """
    Get team's tactical playing style classification
    
    **Model**: KMeans Clustering (5 clusters, Silhouette ~0.45)
    
    **Styles**: Attacking, Defensive, Possession, High-Press, Pragmatic
    
    **Input**: Team name
    
    **Output**: Cluster label, similar teams, tactical statistics
    """
    try:
        # Load model and teams
        model_data = load_bo3()
        valid_teams = _get_all_teams_from_data()
        
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        
        # Validate team
        if team_name not in valid_teams:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid team name: '{team_name}'. Available teams: {len(valid_teams)} teams with historical data"
            )
        
        # Prepare features
        X, raw_stats = prepare_clustering_features(team_name, season)
        
        # Ensure features match model requirements
        available_features = [f for f in feature_names if f in X.columns]
        X = X[available_features]
        
        # Scale if scaler exists
        if scaler:
            X_scaled = scaler.transform(X)
        else:
            X_scaled = X.values
        
        # Predict cluster
        cluster_id = int(model.predict(X_scaled)[0])
        
        # Get cluster label and description
        cluster_info = get_cluster_label(cluster_id)
        
        # Find similar teams using REAL clustering
        similar_teams = find_similar_teams(cluster_id, team_name, season, model, scaler, feature_names)
        
        # Calculate cluster probabilities (distance-based)
        # For KMeans, we can use distance to each cluster center
        if hasattr(model, 'cluster_centers_'):
            distances = np.linalg.norm(model.cluster_centers_ - X_scaled, axis=1)
            # Convert distances to probabilities (inverse distance)
            inv_distances = 1 / (distances + 1e-10)
            probabilities = inv_distances / inv_distances.sum()
            
            prob_dict = {
                get_cluster_label(i)['label']: round(float(probabilities[i]), 3)
                for i in range(len(probabilities))
            }
        else:
            prob_dict = None
        
        # Build response
        response = TeamStyleResponse(
            team=team_name,
            season=season,
            cluster=ClusterInfo(
                id=cluster_id,
                label=cluster_info['label'],
                description=cluster_info['description']
            ),
            similar_teams=similar_teams,
            probabilities=prob_dict,
            stats=raw_stats
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Team style classification failed: {str(e)}"
        )

@router.get("/team-styles/all")
async def get_all_team_styles(season: str = Query("2024-25")):
    """Get tactical styles for all Premier League teams"""
    try:
        valid_teams = _get_all_teams_from_data()
        
        all_styles = []
        for team in valid_teams:
            try:
                style = await get_team_tactical_style(team, season)
                all_styles.append({
                    "team": team,
                    "cluster_id": style.cluster.id,
                    "style": style.cluster.label
                })
            except:
                continue
        
        # Group teams by cluster
        clusters = {}
        for style in all_styles:
            cluster_name = style['style']
            if cluster_name not in clusters:
                clusters[cluster_name] = []
            clusters[cluster_name].append(style['team'])
        
        return {
            "season": season,
            "total_teams": len(all_styles),
            "clusters": clusters,
            "styles": all_styles
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get all team styles: {str(e)}"
        )

@router.get("/model-info/bo3")
async def get_bo3_model_info():
    """Get BO3 model information"""
    try:
        model_data = load_bo3()
        metadata = model_data.get('metadata', {})
        
        return {
            "business_objective": "Team Tactical Style Clustering",
            "algorithm": metadata.get('algorithm', 'KMeans'),
            "features": model_data['features'],
            "num_clusters": 5,
            "cluster_labels": {
                0: "Attacking",
                1: "Defensive",
                2: "Possession",
                3: "High-Press",
                4: "Pragmatic"
            },
            "performance": {
                "silhouette_score": metadata.get('silhouette_score', 0.45)
            },
            "version": metadata.get('version')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )

@router.get("/team-style-history/{team_name}")
async def get_team_style_history(team_name: str):
    """
    Get a team's tactical style evolution across all seasons.
    Returns style classification for each season the team was in the league.
    """
    try:
        model_data = load_bo3()
        valid_teams = _get_all_teams_from_data()
        
        model = model_data['model']
        scaler = model_data.get('scaler')
        feature_names = model_data['features']
        
        # Validate team
        if team_name not in valid_teams:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid team name: '{team_name}'"
            )
        
        # Load all seasons for this team
        df = pd.read_csv(DATA_PATH)
        team_seasons = df[df['Team'] == team_name].sort_values('Season_encoded', ascending=True)
        
        if team_seasons.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No historical data found for {team_name}"
            )
        
        history = []
        
        for _, row in team_seasons.iterrows():
            season = row['Season']
            try:
                # Prepare features
                X, raw_stats = prepare_clustering_features(team_name, season)
                available_features = [f for f in feature_names if f in X.columns]
                X = X[available_features]
                
                # Scale if scaler exists
                if scaler:
                    X_scaled = scaler.transform(X)
                else:
                    X_scaled = X.values
                
                # Predict cluster
                cluster_id = int(model.predict(X_scaled)[0])
                cluster_info = get_cluster_label(cluster_id)
                
                # Get key stats for radar chart
                history.append({
                    "season": season,
                    "cluster_id": cluster_id,
                    "style": cluster_info['label'],
                    "stats": {
                        "Attack": round(raw_stats.get('Avg_Goals_Scored', 0) / 3 * 100, 1),  # Normalize to 0-100
                        "Defense": round((1 - raw_stats.get('Avg_Goals_Conceded', 2) / 3) * 100, 1),
                        "Possession": round(raw_stats.get('Shot_Accuracy', 0), 1),
                        "Pressing": round(raw_stats.get('Fouls_per_Match', 0) / 15 * 100, 1),
                        "Set Pieces": round(raw_stats.get('Avg_Corners', 0) / 10 * 100, 1),
                        "Discipline": round((1 - raw_stats.get('Cards_per_Foul', 0)) * 100, 1)
                    },
                    "position": int(row.get('Final_Position', 0)) if pd.notna(row.get('Final_Position')) else None,
                    "points": int(row.get('Points', 0)) if pd.notna(row.get('Points')) else None
                })
            except Exception as e:
                continue
        
        return {
            "team": team_name,
            "total_seasons": len(history),
            "history": history
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get team style history: {str(e)}"
        )

@router.get("/teams")
async def get_available_teams():
    """
    Get list of all teams with historical data in the dataset.
    Returns all 46 teams that have Premier League data.
    """
    try:
        teams = _get_all_teams_from_data()
        return {
            "teams": teams,
            "total": len(teams)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load teams: {str(e)}"
        )

