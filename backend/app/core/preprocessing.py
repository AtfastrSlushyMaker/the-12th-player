"""
Feature engineering and preprocessing utilities
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any

def calculate_win_rate(wins: int, total_matches: int) -> float:
    """Calculate win rate percentage"""
    if total_matches == 0:
        return 0.0
    return round(wins / total_matches, 4)

def calculate_points(wins: int, draws: int) -> int:
    """Calculate total points (3 for win, 1 for draw)"""
    return (wins * 3) + draws

def calculate_goal_difference(scored: int, conceded: int) -> int:
    """Calculate goal difference"""
    return scored - conceded

def prepare_season_ranking_features(team_stats: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare features for BO1 season ranking prediction with naming aligned to trained model.

    Model expects (underscored) feature names:
    ['Wins','Draws','Losses','Goals_Scored','Goals_Conceded','Goal_Difference','Points','Win_Rate','Clean_Sheet_Rate']
    """
    total_matches = team_stats['wins'] + team_stats['draws'] + team_stats['losses']
    wins = team_stats['wins']
    draws = team_stats['draws']
    losses = team_stats['losses']
    goals_scored = team_stats['goals_scored']
    goals_conceded = team_stats['goals_conceded']
    clean_sheets = team_stats.get('clean_sheets', 0)
    win_rate = team_stats.get('win_rate', calculate_win_rate(wins, total_matches))
    
    # Use clean_sheet_rate directly if provided, else calculate
    clean_sheet_rate = team_stats.get('clean_sheet_rate')
    if clean_sheet_rate is None:
        clean_sheet_rate = 0.0 if total_matches == 0 else round(clean_sheets / total_matches, 4)

    return {
        'Wins': wins,
        'Draws': draws,
        'Losses': losses,
        'Goals_Scored': goals_scored,
        'Goals_Conceded': goals_conceded,
        'Goal_Difference': calculate_goal_difference(goals_scored, goals_conceded),
        'Points': calculate_points(wins, draws),
        'Win_Rate': win_rate,
        'Clean_Sheet_Rate': clean_sheet_rate
    }

def assign_confidence_level(mae: float, prediction: float) -> str:
    """
    Assign confidence level based on MAE and prediction value
    
    For BO1 (Season Ranking):
    - MAE ~1.15 positions
    - High: within 1 position
    - Medium: within 2 positions  
    - Low: >2 positions uncertainty
    """
    if mae <= 1.0:
        return "high"
    elif mae <= 2.0:
        return "medium"
    else:
        return "low"

def get_outcome_label(prediction: int) -> str:
    """
    Convert numerical prediction to outcome label
    
    For BO2 (Match Prediction):
    0 = Away Win
    1 = Draw
    2 = Home Win
    """
    labels = {0: "Away Win", 1: "Draw", 2: "Home Win"}
    return labels.get(prediction, "Unknown")

def calculate_match_confidence(probabilities: List[float]) -> str:
    """
    Calculate confidence based on probability distribution
    
    High: max_prob > 0.6
    Medium: max_prob 0.4-0.6
    Low: max_prob < 0.4
    """
    max_prob = max(probabilities)
    
    if max_prob > 0.6:
        return "high"
    elif max_prob >= 0.4:
        return "medium"
    else:
        return "low"

def get_cluster_label(cluster_id: int) -> Dict[str, str]:
    """
    Map cluster ID to tactical style label and description
    
    Based on BO3 clustering analysis
    """
    cluster_mapping = {
        0: {
            "label": "Attacking",
            "description": "High-scoring teams with aggressive offensive tactics"
        },
        1: {
            "label": "Defensive",
            "description": "Solid defensive units prioritizing clean sheets"
        },
        2: {
            "label": "Possession",
            "description": "Ball-dominant teams controlling the game through passing"
        },
        3: {
            "label": "High-Press",
            "description": "Intense pressing and high-tempo playing style"
        },
        4: {
            "label": "Pragmatic",
            "description": "Balanced approach adapting to match situations"
        }
    }
    
    return cluster_mapping.get(cluster_id, {
        "label": "Unknown",
        "description": "Tactical style not categorized"
    })

def filter_young_players(df: pd.DataFrame, position: str) -> pd.DataFrame:
    """
    Filter players by age based on position
    
    BO4 criteria:
    - Outfield (defender, midfielder, forward): age < 23
    - Goalkeeper: age < 26
    """
    if position.lower() == 'goalkeeper':
        return df[df['Age'] < 26]
    else:
        return df[df['Age'] < 23]

def rank_players_by_score(df: pd.DataFrame, limit: int = 10) -> pd.DataFrame:
    """
    Rank players by predicted performance score
    
    Returns top N players sorted by score descending
    """
    return df.nlargest(limit, 'predicted_score')
