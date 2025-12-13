"""
Model loader with singleton pattern
Loads all .pkl files on startup and caches them
"""
import joblib
import json
from pathlib import Path
from functools import lru_cache
from typing import Dict, Any

MODELS_DIR = Path(__file__).parent.parent.parent / "models"

@lru_cache()
def load_teams() -> list:
    """Load teams.json - list of all PL teams"""
    with open(MODELS_DIR / "teams.json", "r") as f:
        return json.load(f)

@lru_cache()
def load_team_encoding() -> Dict[str, int]:
    """Load team_encoding.json - team name to numerical encoding"""
    with open(MODELS_DIR / "team_encoding.json", "r") as f:
        return json.load(f)

@lru_cache()
def load_bo1() -> Dict[str, Any]:
    """Load BO1 Season Ranking model (KNN Regressor)"""
    return joblib.load(MODELS_DIR / "bo1_season_ranking.pkl")

@lru_cache()
def load_bo2() -> Dict[str, Any]:
    """Load BO2 Match Prediction model (Random Forest Classifier)"""
    return joblib.load(MODELS_DIR / "bo2_match_prediction.pkl")

@lru_cache()
def load_bo3() -> Dict[str, Any]:
    """Load BO3 Team Style Clustering model (KMeans)"""
    return joblib.load(MODELS_DIR / "bo3_kmeans_clustering.pkl")

@lru_cache()
def load_bo4(position: str) -> Dict[str, Any]:
    """
    Load BO4 Player Recommendation model (LightGBM)
    
    Args:
        position: One of 'defender', 'midfielder', 'forward', 'goalkeeper'
    """
    valid_positions = ['defender', 'midfielder', 'forward', 'goalkeeper']
    if position.lower() not in valid_positions:
        raise ValueError(f"Position must be one of {valid_positions}")
    
    return joblib.load(MODELS_DIR / f"bo4_{position.lower()}_lgb.pkl")

@lru_cache()
def load_naive_bayes_news_classifier() -> Dict[str, Any]:
    """
    Load BO5 Ensemble News Credibility Classifier (upgraded)
    
    Returns package dict with:
    - 'ensemble_model': VotingClassifier with 4 models
    - 'vectorizer': FeatureUnion with word + char TF-IDF
    - 'preprocessor': TextPreprocessor instance
    - 'tier_names': Human-readable tier labels
    - 'test_accuracy': 0.768
    - 'cv_accuracy': 0.755
    """
    return joblib.load(MODELS_DIR / "pl_news_credibility_model.pkl")

def get_model_info(model_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from model dictionary"""
    return {
        "features": model_data.get("features", []),
        "metadata": model_data.get("metadata", {}),
        "has_scaler": model_data.get("scaler") is not None
    }
