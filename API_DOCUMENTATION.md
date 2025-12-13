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
  "title": "Official: Liverpool complete signing",
  "predicted_tier": 1,
  "tier_label": "Tier 1 - Official Source",
  "confidence": 0.93,
  "probabilities": {
    "tier_1": 0.93,
    "tier_2": 0.05,
    "tier_3": 0.02,
    "tier_4": 0.00
  },
  "credibility_description": "Official sources (BBC, ESPN, official club statements)"
}
```

**Tier Levels:**
- **Tier 1**: Official sources (BBC, club statements, verified journalists)
- **Tier 2**: Reliable sports journalists and reputable outlets
- **Tier 3**: Tabloids, sports blogs, sensationalist coverage
- **Tier 4**: Social media posts, unverified sources

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

**Response:**
```json
{
  "business_objective": "Predict final Premier League standings",
  "algorithm": "Random Forest Regressor",
  "features": [
    "wins",
    "draws",
    "losses",
    "goals_scored",
    "goals_conceded"
  ],
  "performance": {
    "mae": 2.03,
    "r2_score": 0.938
  },
  "version": "1.0.0",
  "limitations": [
    "Assumes consistent team performance",
    "Does not account for injuries or transfers"
  ]
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

### Version 1.0.0 (December 2025)
- Initial API release
- 5 ML models (BO1-BO5)
- 25 years of Premier League historical data (2000-2025)
- Real-time match results via TheSportsDB integration
- News credibility classification with Naive Bayes
