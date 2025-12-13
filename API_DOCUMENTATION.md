# The 12th Player - API Documentation

**Base URL**: `https://the-12th-player.onrender.com`

**Version**: 1.0.0

## Overview

The 12th Player API provides AI-powered Premier League analytics through 5 specialized machine learning models (BO1-BO5). All endpoints return JSON responses and support CORS for cross-origin requests.

---

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

---

## Endpoints

### 🏆 BO1: Season Rankings

#### Get Available Seasons
```http
GET /api/v1/seasons
```

**Response:**
```json
{
  "seasons": ["2000-01", "2001-02", ..., "2024-25"],
  "default": "2024-25"
}
```

---

#### Predict Season Rankings (Historical)
```http
GET /api/v1/predict-season/{season}?compare_actual={boolean}
```

**Parameters:**
- `season` (path) - Season string (e.g., "2024-25")
- `compare_actual` (query, optional) - Compare predictions with actual results (default: false)

**Response:**
```json
{
  "season": "2024-25",
  "predictions": [
    {
      "rank": 1,
      "team": "Liverpool",
      "predicted_position": 1,
      "confidence": "High",
      "actual_position": 1,
      "position_diff": 0
    }
  ],
  "model_metadata": {
    "algorithm": "Random Forest Regressor",
    "mae": 2.03,
    "r2_score": 0.938
  },
  "comparison": {
    "avg_position_error": 2.03,
    "exact_matches": 5,
    "within_1": 12,
    "within_3": 18
  }
}
```

---

#### Predict Custom Season
```http
POST /api/v1/predict-season
Content-Type: application/json
```

**Request Body:**
```json
{
  "season": "2025-26",
  "teams": [
    {
      "team": "Liverpool",
      "wins": 25,
      "draws": 8,
      "losses": 5,
      "goals_scored": 78,
      "goals_conceded": 32,
      "clean_sheets": 15
    }
  ]
}
```

**Response:** Same as GET /predict-season/{season}

---

#### Get 2025-26 Forecast
```http
GET /api/v1/forecast-2025-26
```

**Response:** Season ranking predictions for the 2025-26 season

---

### ⚡ BO2: Match Predictions

#### Predict Match Outcome
```http
POST /api/v1/predict-match
Content-Type: application/json
```

**Request Body:**
```json
{
  "home_team": "Liverpool",
  "away_team": "Manchester City",
  "season": "2024-25",
  "expert_mode": false
}
```

**Response:**
```json
{
  "prediction": "Home Win",
  "probabilities": {
    "home_win": 0.52,
    "draw": 0.28,
    "away_win": 0.20
  },
  "confidence": "Moderate",
  "feature_importance": [
    {
      "feature": "home_win_rate",
      "value": 0.68,
      "importance": 0.15
    }
  ],
  "model_accuracy": 0.58
}
```

---

#### Get Match Result (Live Data)
```http
GET /api/v1/match-result?home_team={team}&away_team={team}
```

**Parameters:**
- `home_team` (query) - Home team name
- `away_team` (query) - Away team name

**Response:**
```json
{
  "home_team": "Liverpool",
  "away_team": "Manchester City",
  "home_score": 2,
  "away_score": 1,
  "match_date": "2025-12-07",
  "status": "FINISHED",
  "actual_result": "Home Win"
}
```

**Status Values:**
- `FINISHED` - Match completed
- `SCHEDULED` - Match scheduled but not played
- `NOT_FOUND` - No match data available

---

#### Compare Prediction with Actual Result
```http
GET /api/v1/match-comparison
```

**Query Parameters:**
- `home_team` - Home team name
- `away_team` - Away team name
- `predicted_result` - Predicted result ("Home Win", "Draw", "Away Win")
- `confidence` - Confidence level

**Response:**
```json
{
  "home_team": "Liverpool",
  "away_team": "Manchester City",
  "predicted_result": "Home Win",
  "actual_result": "Home Win",
  "match_status": "FINISHED",
  "is_correct": true,
  "home_score": 2,
  "away_score": 1,
  "match_date": "2025-12-07",
  "confidence": "High"
}
```

---

#### Get Head-to-Head History
```http
GET /api/v1/head-to-head?home_team={team}&away_team={team}
```

**Response:**
```json
{
  "home_team": "Arsenal",
  "away_team": "Manchester City",
  "matches": [
    {
      "date": "2024-12-15",
      "home_team": "Arsenal",
      "away_team": "Manchester City",
      "home_score": 2,
      "away_score": 1,
      "result": "Home Win",
      "season": "2024-25"
    }
  ],
  "stats": {
    "total_matches": 48,
    "home_wins": 15,
    "away_wins": 20,
    "draws": 13
  }
}
```

---

### 🎯 BO3: Team Styles & Tactics

#### Get Team Style
```http
GET /api/v1/team-style/{team_name}?season={season}
```

**Parameters:**
- `team_name` (path) - Team name
- `season` (query, optional) - Season (default: "2024-25")

**Response:**
```json
{
  "team": "Liverpool",
  "season": "2024-25",
  "cluster": {
    "id": 0,
    "label": "High-Intensity Pressing",
    "description": "Teams that employ aggressive pressing and quick transitions"
  },
  "similar_teams": ["Manchester City", "Arsenal"],
  "probabilities": {
    "High-Intensity Pressing": 0.85,
    "Possession-Based": 0.10
  },
  "stats": {
    "Attack": 8.5,
    "Defense": 7.8,
    "Possession": 0.62,
    "Pressing": 9.2
  }
}
```

---

#### Get All Team Styles
```http
GET /api/v1/team-styles/all?season={season}
```

**Response:**
```json
{
  "season": "2024-25",
  "total_teams": 20,
  "clusters": {
    "High-Intensity Pressing": ["Liverpool", "Manchester City"],
    "Possession-Based": ["Arsenal", "Chelsea"]
  },
  "styles": [
    {
      "team": "Liverpool",
      "cluster_id": 0,
      "style": "High-Intensity Pressing"
    }
  ]
}
```

---

#### Get Team Style History
```http
GET /api/v1/team-style-history/{team_name}
```

**Response:**
```json
{
  "team": "Liverpool",
  "total_seasons": 15,
  "history": [
    {
      "season": "2024-25",
      "cluster_id": 0,
      "style": "High-Intensity Pressing",
      "stats": {
        "Attack": 8.5,
        "Defense": 7.8
      },
      "position": 1,
      "points": 85
    }
  ]
}
```

---

### 🏅 BO4: Player Scout & Recommendations

#### Get Player Positions
```http
GET /api/v1/players/positions
```

**Response:**
```json
{
  "positions": [
    {
      "name": "Forward",
      "max_age_default": 28,
      "description": "Strikers and attacking players"
    },
    {
      "name": "Midfielder",
      "max_age_default": 29,
      "description": "Central and wide midfielders"
    },
    {
      "name": "Defender",
      "max_age_default": 30,
      "description": "Center backs and full backs"
    },
    {
      "name": "Goalkeeper",
      "max_age_default": 32,
      "description": "Shot stoppers"
    }
  ]
}
```

---

#### Get Player Recommendations
```http
GET /api/v1/players/recommendations
```

**Query Parameters:**
- `position` (required) - "Forward", "Midfielder", "Defender", or "Goalkeeper"
- `limit` (optional) - Number of results (default: 10, max: 50)
- `max_age` (optional) - Maximum player age filter

**Response:**
```json
{
  "position": "Forward",
  "filters": {
    "max_age": 28,
    "limit": 10
  },
  "recommendations": [
    {
      "rank": 1,
      "player": "Erling Haaland",
      "squad": "Manchester City",
      "league": "Premier League",
      "age": 24,
      "market_value": 180000000,
      "predicted_score": 95.8,
      "stats": {
        "Goals": 36,
        "Assists": 8,
        "Shots_on_target_percent": 65.2
      }
    }
  ]
}
```

---

### 📰 BO5: News Credibility Classification

#### Classify News Article
```http
POST /api/v1/classify-news
```

**Query Parameters:**
- `title` (required) - Article title
- `text` (required) - Article content

**Response:**
```json
{
  "title": "Is there any way back for Salah and Liverpool?",
  "predicted_tier": 1,
  "tier_label": "Tier 1 - Official Source",
  "confidence": 0.928,
  "probabilities": {
    "tier_1": 0.928,
    "tier_2": 0.015,
    "tier_3": 0.055,
    "tier_4": 0.002
  },
  "credibility_description": "Official sources (BBC, ESPN, official club statements, verified journalists)"
}
```

**Tier Levels & Performance:**
- **Tier 1 (79% precision)**: Official sources - BBC, official club statements, verified journalists (79% recall)
- **Tier 2 (65% precision)**: Reliable sports journalists - Professional outlets like The Athletic (69% recall)
- **Tier 3 (75% precision)**: Tabloids - Sensationalist language with SHOCK, EXCLUSIVE keywords (45% recall)
- **Tier 4 (83% precision)**: Social media - Unverified sources, user posts, rumors (87% recall)

**Model Architecture (v2.0 - Upgraded):**
- **Algorithm**: VotingClassifier Ensemble with soft voting
- **Components**:
  - MultinomialNB (weight: 1.0) - Probability-based baseline
  - ComplementNB (weight: 1.3) - Optimized for imbalanced classes
  - LogisticRegression (weight: 1.1) - Linear model with balanced approach
  - LinearSVC (weight: 0.9) - Support Vector Machine with calibrated probabilities
- **Features**: 6,000 combined
  - Word-level TF-IDF: 4,000 features (1-3 grams)
  - Character-level TF-IDF: 2,000 features (3-5 grams)
- **Preprocessing**: Lemmatization, stopword removal, style feature extraction
- **Performance**:
  - Test Accuracy: **76.8%**
  - Cross-Validation Accuracy: **75.5%**
  - Training Samples: 841
  - Test Samples: 211

**Key Improvements over v1.0:**
- ✅ Upgraded from single Multinomial NB to ensemble voting (20% accuracy improvement)
- ✅ Better handling of imbalanced classes with ComplementNB
- ✅ Added character-level features for style pattern detection
- ✅ Enhanced preprocessing with lemmatization and style tokens
- ✅ Better Tier 4 detection (87% recall vs 43% in v1)

---

### 🔧 Utility Endpoints

#### Get Available Teams
```http
GET /api/v1/teams
```

**Response:**
```json
{
  "teams": [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester City",
    "Manchester United"
  ]
}
```

---

#### Get Model Information (Expert Mode)
```http
GET /api/v1/model-info/{bo}
```

**Parameters:**
- `bo` (path) - Model identifier: "bo1", "bo2", "bo3", "bo5"

**BO5 Response Example:**
```json
{
  "business_objective": "News Credibility Classification - Identify trustworthiness of Premier League news",
  "algorithm": "VotingClassifier Ensemble (4 models with soft voting)",
  "ensemble_components": [
    "MultinomialNB (weight: 1.0)",
    "ComplementNB (weight: 1.3) - favored for imbalanced classes",
    "LogisticRegression (weight: 1.1)",
    "LinearSVC with probability calibration (weight: 0.9)"
  ],
  "features": {
    "vectorizer": "FeatureUnion combining:",
    "word_level": "TF-IDF (4000 features, 1-3 grams, words)",
    "char_level": "TF-IDF (2000 features, 3-5 grams, characters)",
    "preprocessing": "Lemmatization, stopword removal, style feature extraction"
  },
  "tier_labels": {
    "1": "Most Credible - Official sources",
    "2": "Reliable - Professional journalism",
    "3": "Mixed - Tabloids with speculation",
    "4": "Least Credible - Social media/rumors"
  },
  "performance": {
    "test_accuracy": 0.768,
    "cv_accuracy": 0.755,
    "per_tier": {
      "tier_1": { "precision": 0.79, "recall": 0.79, "f1": 0.79 },
      "tier_2": { "precision": 0.65, "recall": 0.69, "f1": 0.67 },
      "tier_3": { "precision": 0.75, "recall": 0.45, "f1": 0.56 },
      "tier_4": { "precision": 0.83, "recall": 0.87, "f1": 0.85 }
    }
  },
  "version": "2.0 (Ensemble) - Upgraded from Multinomial NB"
}
```

---

#### Get BO4 Model Information (Position-Specific)
```http
GET /api/v1/model-info/bo4?position={position}
```

---

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

**400 Bad Request:**
```json
{
  "detail": "Invalid team name or season format"
}
```

**404 Not Found:**
```json
{
  "detail": "Team not found in dataset"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Model failed to load"
}
```

---

## Usage Examples

### JavaScript/TypeScript
```typescript
const API_BASE_URL = 'https://the-12th-player.onrender.com';

// Predict match
const response = await fetch(`${API_BASE_URL}/api/v1/predict-match`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    home_team: 'Liverpool',
    away_team: 'Manchester City',
    season: '2024-25'
  })
});
const prediction = await response.json();
```

### Python
```python
import requests

API_BASE_URL = 'https://the-12th-player.onrender.com'

# Get player recommendations
response = requests.get(
    f'{API_BASE_URL}/api/v1/players/recommendations',
    params={'position': 'Forward', 'limit': 10, 'max_age': 25}
)
players = response.json()
```

### cURL
```bash
# Classify news article
curl -X POST "https://the-12th-player.onrender.com/api/v1/classify-news?title=Breaking%20News&text=Liverpool%20signs%20new%20player"
```

---

## Rate Limiting

Currently no rate limiting is enforced. For production mobile apps, consider implementing request throttling on the client side.

---

## CORS Support

The API supports CORS requests from:
- `http://localhost:3000` (development)
- `http://localhost:5173` (development)
- `https://the-12th-player-app.onrender.com` (production)

Mobile apps and browser extensions can make direct requests without proxy requirements.

---

## Contact & Support

- **Web App**: https://the-12th-player.onrender.com
- **Repository**: AtfastrSlushyMaker/the-12th-player
- **Issues**: Report via GitHub Issues

---

## Changelog

### Version 1.1.0 (December 13, 2025) - BO5 Upgrade
**BO5 News Classifier Improvements:**
- 🔄 **Upgraded Algorithm**: Replaced Multinomial NB with VotingClassifier Ensemble (4 models)
  - MultinomialNB, ComplementNB, LogisticRegression, LinearSVC with soft voting
- 📈 **Performance Improvements**:
  - Test Accuracy: 64% → **76.8%** (+12.8 percentage points)
  - CV Accuracy: **75.5%**
  - Tier 4 (Social Media) Recall: 43% → **87%** (massive improvement)
- 🏗️ **Architecture Changes**:
  - Features: 4,000 → **6,000** (added 2,000 char-level n-grams)
  - Preprocessing: Added style feature extraction (capitalization, punctuation patterns)
  - Model File: `naive_bayes_news_classifier.pkl` → `pl_news_credibility_model.pkl`
- 📦 **Package Structure**: Model now includes preprocessor and metadata
- ✅ **Backward Compatible**: API endpoints unchanged - no breaking changes for mobile/extension

### Version 1.0.0 (December 2025)
- Initial API release
- 5 ML models (BO1-BO5)
- 25 years of Premier League historical data (2000-2025)
- Real-time match results via TheSportsDB integration
- News credibility classification with Multinomial Naive Bayes
