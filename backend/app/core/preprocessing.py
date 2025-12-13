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


# Import NLTK for TextPreprocessor
import re
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize
    
    # Ensure NLTK data is available
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)
    
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)
    
    try:
        nltk.data.find('corpora/wordnet')
    except LookupError:
        nltk.download('wordnet', quiet=True)
except:
    pass


class TextPreprocessor:
    """
    Multi-stage text preprocessing for news credibility classification.
    
    Stages:
    1. Basic cleaning (lowercase, remove URLs, HTML, mentions)
    2. Lemmatization and stopword removal
    3. Style feature extraction (caps, punctuation, sensational keywords)
    """
    
    def __init__(self):
        """Initialize preprocessor with NLTK tools"""
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
            # Keep negations - they're important for credibility
            self.stop_words -= {'not', 'no', 'never', 'against'}
        except Exception as e:
            # Fallback if NLTK data missing
            self.lemmatizer = None
            self.stop_words = set()
    
    def clean(self, text: str) -> str:
        """
        Stage 1: Basic text cleaning
        - Lowercase
        - Remove URLs, emails, HTML tags, mentions, hashtags
        - Keep only letters and punctuation
        """
        if not text or pd.isna(text):
            return ""
        
        text = str(text).lower()
        
        # Remove URLs, emails, HTML tags, mentions, hashtags
        text = re.sub(r'http\S+|www\S+|\S+@\S+|<[^>]+>|@\w+|#\w+', '', text)
        
        # Keep only letters and punctuation
        text = re.sub(r'[^a-z\s\.\!\?]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def lemmatize(self, text: str) -> str:
        """
        Stage 2: Lemmatization and stopword removal
        - Tokenize
        - Lemmatize each token
        - Remove stopwords (except negations)
        """
        if not text or self.lemmatizer is None:
            return text
        
        try:
            tokens = word_tokenize(text)
            # Filter: remove stopwords, keep words > 2 chars
            tokens = [
                self.lemmatizer.lemmatize(w) for w in tokens
                if w not in self.stop_words and len(w) > 2
            ]
            return ' '.join(tokens)
        except Exception:
            # Fallback - return original text
            return text
    
    def add_style_features(self, text: str) -> str:
        """
        Stage 3: Extract style features for credibility detection
        Detects:
        - Multiple exclamation marks (sensationalism)
        - Multiple question marks (clickbait)
        - High capitalization (tabloid style)
        - Sensational keywords (EXCLUSIVE, SHOCK, BOMBSHELL)
        """
        if not text:
            return ""
        
        text_str = str(text)
        features = []
        
        # Punctuation patterns indicating sensationalism
        if text_str.count('!') > 2:
            features.append('_MULTIEXCLAIM_')
        
        if text_str.count('?') > 2:
            features.append('_MULTIQUESTION_')
        
        # Capitalization ratio
        caps_ratio = sum(1 for c in text_str if c.isupper()) / (len(text_str) + 1)
        if caps_ratio > 0.05:  # More than 5% caps
            features.append('_HIGHCAPS_')
        
        # Sensational keywords
        sensational_words = [
            'exclusive', 'shocking', 'bombshell', 'revealed',
            'slammed', 'blasts', 'stunning', 'massive'
        ]
        for word in sensational_words:
            if word in text_str.lower():
                features.append(f'_SENSATIONAL_{word.upper()}_')
        
        return ' '.join(features)
    
    def transform(self, texts):
        """
        Process list of texts through all stages
        
        Args:
            texts: List of strings to preprocess
            
        Returns:
            List of preprocessed strings
        """
        results = []
        for text in texts:
            # Stage 1: Clean
            cleaned = self.clean(text)
            
            # Stage 2: Lemmatize
            lemmatized = self.lemmatize(cleaned)
            
            # Stage 3: Add style features
            style = self.add_style_features(text)
            
            # Combine all stages
            processed = f"{lemmatized} {style}".strip()
            results.append(processed)
        
        return results
