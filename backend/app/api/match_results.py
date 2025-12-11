"""
Match Results API - Fetch real match results for comparison
Uses TheSportsDB API (completely free, no API key required!)
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import requests
from datetime import datetime

router = APIRouter()

# TheSportsDB API (free, no API key needed)
THESPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"

# Team IDs for Premier League teams (from TheSportsDB - verified Dec 2025)
TEAM_IDS = {
    "Arsenal": "133604",
    "Aston Villa": "133601",
    "Bournemouth": "134301",
    "Brentford": "134355",
    "Brighton": "133603",
    "Burnley": "133614",
    "Chelsea": "133610",
    "Crystal Palace": "133632",
    "Everton": "133615",
    "Fulham": "133600",
    "Leeds United": "133619",
    "Liverpool": "133602",
    "Man City": "133613",
    "Man United": "133612",
    "Newcastle": "134777",
    "Nottingham Forest": "133720",
    "Sunderland": "133625",
    "Tottenham": "133616",
    "West Ham": "133636",
    "Wolves": "133599"
}

# Team name variations for matching
TEAM_NAME_VARIATIONS = {
    "Arsenal": ["Arsenal", "Arsenal FC"],
    "Man City": ["Manchester City", "Man City", "Manchester City FC"],
    "Man United": ["Manchester United", "Man Utd", "Manchester United FC"],
    "Newcastle": ["Newcastle United", "Newcastle", "Newcastle United FC"],
    "Nottingham Forest": ["Nottm Forest", "Nottingham Forest", "Nottingham Forest FC"],
    "Tottenham": ["Tottenham", "Spurs", "Tottenham Hotspur"],
    "West Ham": ["West Ham", "West Ham United"],
    "Wolves": ["Wolves", "Wolverhampton", "Wolverhampton Wanderers"],
    "Brighton": ["Brighton", "Brighton & Hove Albion"],
    "Bournemouth": ["Bournemouth", "AFC Bournemouth"],
}


# Pydantic Models
class MatchResult(BaseModel):
    home_team: str
    away_team: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: Optional[str] = None
    status: str  # "FINISHED", "SCHEDULED", "IN_PLAY", "POSTPONED"
    actual_result: Optional[str] = None  # "Home Win", "Draw", "Away Win"


class MatchComparisonResponse(BaseModel):
    home_team: str
    away_team: str
    predicted_result: str
    actual_result: Optional[str] = None
    match_status: str
    is_correct: Optional[bool] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: Optional[str] = None
    confidence: str


class HeadToHeadMatch(BaseModel):
    date: Optional[str] = None
    home_team: str
    away_team: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    result: Optional[str] = None
    season: str


class HeadToHeadStats(BaseModel):
    total_matches: int
    home_wins: int
    away_wins: int
    draws: int


class HeadToHeadResponse(BaseModel):
    home_team: str
    away_team: str
    matches: List[HeadToHeadMatch]
    stats: HeadToHeadStats


# Helper Functions
def match_team_name(team_name: str, match_team_name: str) -> bool:
    """Check if team names match, considering variations"""
    team_variations = TEAM_NAME_VARIATIONS.get(team_name, [team_name])
    for variation in team_variations:
        if variation.lower() in match_team_name.lower() or match_team_name.lower() in variation.lower():
            return True
    return team_name.lower() in match_team_name.lower() or match_team_name.lower() in team_name.lower()


def extract_season_from_date(date_str: Optional[str]) -> str:
    """Extract season from date (e.g., 2024-05-15 -> 2023-24)"""
    if not date_str:
        return "Unknown"
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        year = dt.year
        month = dt.month
        # Premier League seasons: Aug-July
        if month >= 8:
            return f"{year}-{year+1-2000}"
        else:
            return f"{year-1}-{year-2000}"
    except:
        return "Unknown"


def get_match_result(home_team: str, away_team: str) -> Optional[MatchResult]:
    """
    Fetch match result from TheSportsDB API (free, no key needed!)
    Searches for recent Premier League matches between the two teams.
    Looks back through last several matches to find completed games.
    """
    try:
        home_team_id = TEAM_IDS.get(home_team)
        
        if not home_team_id:
            return None
        
        # Get last 30 matches (covers multiple months)
        response = requests.get(
            f"{THESPORTSDB_BASE_URL}/eventslast.php",
            params={"id": home_team_id},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            events = data.get("results", [])
            
            if not events:
                return None
            
            # Search for match between these two teams (prioritize finished matches)
            finished_matches = []
            scheduled_matches = []
            
            for event in events:
                event_home = event.get("strHomeTeam", "")
                event_away = event.get("strAwayTeam", "")
                league = event.get("strLeague", "")
                
                # Check if it's a Premier League match
                if "Premier League" not in league and "English Premier League" not in league:
                    continue
                
                # Check if teams match
                home_match = match_team_name(home_team, event_home)
                away_match = match_team_name(away_team, event_away)
                reverse_home = match_team_name(home_team, event_away)
                reverse_away = match_team_name(away_team, event_home)
                
                if (home_match and away_match) or (reverse_home and reverse_away):
                    status = event.get("strStatus", "")
                    
                    # Organize by status (finished first)
                    if status == "Match Finished" or status == "FT":
                        finished_matches.append(event)
                    else:
                        scheduled_matches.append(event)
            
            # Process finished matches first, then scheduled
            all_matches = finished_matches + scheduled_matches
            
            if all_matches:
                event = all_matches[0]
                event_home = event.get("strHomeTeam", "")
                event_away = event.get("strAwayTeam", "")
                
                home_score = event.get("intHomeScore")
                away_score = event.get("intAwayScore")
                
                # Check if scores need to be swapped
                reverse_home = match_team_name(home_team, event_away)
                reverse_away = match_team_name(away_team, event_home)
                
                if reverse_home and reverse_away:
                    home_score, away_score = away_score, home_score
                    event_home, event_away = event_away, event_home
                
                try:
                    home_score = int(home_score) if home_score else None
                    away_score = int(away_score) if away_score else None
                except (ValueError, TypeError):
                    home_score = None
                    away_score = None
                
                status = event.get("strStatus", "")
                actual_result = None
                
                if status == "Match Finished" or status == "FT":
                    status = "FINISHED"
                    if home_score is not None and away_score is not None:
                        if home_score > away_score:
                            actual_result = "Home Win"
                        elif home_score < away_score:
                            actual_result = "Away Win"
                        else:
                            actual_result = "Draw"
                else:
                    status = "SCHEDULED"
                
                match_date = event.get("dateEvent")
                if match_date:
                    try:
                        dt = datetime.strptime(match_date, "%Y-%m-%d")
                        match_date = dt.isoformat()
                    except:
                        pass
                
                return MatchResult(
                    home_team=home_team,
                    away_team=away_team,
                    home_score=home_score,
                    away_score=away_score,
                    match_date=match_date,
                    status=status,
                    actual_result=actual_result
                )
        
        return None
        
    except requests.exceptions.Timeout:
        print("TheSportsDB API timeout")
        return None
    except requests.exceptions.RequestException as e:
        print(f"TheSportsDB API error: {e}")
        return None
    except Exception as e:
        print(f"Error fetching match result: {e}")
        return None


# API Endpoints
@router.get("/match-result", response_model=MatchResult)
async def get_match_result_endpoint(
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name")
):
    """
    Get actual match result if available.
    Returns match status and score if the game has been played.
    """
    result = get_match_result(home_team, away_team)
    
    if result is None:
        # Return scheduled status if no result found
        return MatchResult(
            home_team=home_team,
            away_team=away_team,
            status="SCHEDULED",
            match_date=None,
            actual_result=None
        )
    
    return result


@router.get("/match-comparison", response_model=MatchComparisonResponse)
async def compare_match_prediction(
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name"),
    predicted_result: str = Query(..., description="Predicted result"),
    confidence: str = Query(..., description="Prediction confidence")
):
    """
    Compare predicted result with actual match result.
    Returns comparison data including correctness if match is finished.
    """
    result = get_match_result(home_team, away_team)
    
    is_correct = None
    actual_result = None
    status = "SCHEDULED"
    home_score = None
    away_score = None
    match_date = None
    
    if result:
        status = result.status
        actual_result = result.actual_result
        home_score = result.home_score
        away_score = result.away_score
        match_date = result.match_date
        
        if status == "FINISHED" and actual_result:
            is_correct = (predicted_result == actual_result)
    
    return MatchComparisonResponse(
        home_team=home_team,
        away_team=away_team,
        predicted_result=predicted_result,
        actual_result=actual_result,
        match_status=status,
        is_correct=is_correct,
        home_score=home_score,
        away_score=away_score,
        match_date=match_date,
        confidence=confidence
    )


@router.get("/head-to-head", response_model=HeadToHeadResponse)
async def get_head_to_head_history(
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name"),
    limit: int = Query(10, description="Max number of matches to return")
):
    """
    Get historical head-to-head matches between two teams.
    Returns recent matches from the last several seasons.
    """
    try:
        home_team_id = TEAM_IDS.get(home_team)
        
        if not home_team_id:
            return HeadToHeadResponse(
                home_team=home_team,
                away_team=away_team,
                matches=[],
                stats=HeadToHeadStats(total_matches=0, home_wins=0, away_wins=0, draws=0)
            )
        
        # Get last 15 matches for the home team
        response = requests.get(
            f"{THESPORTSDB_BASE_URL}/eventslast.php",
            params={"id": home_team_id},
            timeout=5
        )
        
        if response.status_code != 200:
            return HeadToHeadResponse(
                home_team=home_team,
                away_team=away_team,
                matches=[],
                stats=HeadToHeadStats(total_matches=0, home_wins=0, away_wins=0, draws=0)
            )
        
        data = response.json()
        events = data.get("results", [])
        
        h2h_matches: List[HeadToHeadMatch] = []
        home_wins = 0
        away_wins = 0
        draws = 0
        
        for event in events:
            event_home = event.get("strHomeTeam", "")
            event_away = event.get("strAwayTeam", "")
            
            # Check if both teams match
            home_match = match_team_name(home_team, event_home)
            away_match = match_team_name(away_team, event_away)
            
            # Also check reverse
            reverse_home = match_team_name(home_team, event_away)
            reverse_away = match_team_name(away_team, event_home)
            
            if (home_match and away_match) or (reverse_home and reverse_away):
                # Found a head-to-head match
                home_score = event.get("intHomeScore")
                away_score = event.get("intAwayScore")
                
                # If scores are swapped, fix them
                if reverse_home and reverse_away:
                    home_score, away_score = away_score, home_score
                    event_home, event_away = event_away, event_home
                
                try:
                    home_score = int(home_score) if home_score else None
                    away_score = int(away_score) if away_score else None
                except (ValueError, TypeError):
                    home_score = None
                    away_score = None
                
                result = None
                if home_score is not None and away_score is not None:
                    if home_score > away_score:
                        result = "Home Win"
                        home_wins += 1
                    elif home_score < away_score:
                        result = "Away Win"
                        away_wins += 1
                    else:
                        result = "Draw"
                        draws += 1
                
                match_date = event.get("dateEvent")
                season = extract_season_from_date(match_date) if match_date else "Unknown"
                
                h2h_matches.append(HeadToHeadMatch(
                    date=match_date,
                    home_team=home_team,
                    away_team=away_team,
                    home_score=home_score,
                    away_score=away_score,
                    result=result,
                    season=season
                ))
                
                if len(h2h_matches) >= limit:
                    break
        
        stats = HeadToHeadStats(
            total_matches=len(h2h_matches),
            home_wins=home_wins,
            away_wins=away_wins,
            draws=draws
        )
        
        return HeadToHeadResponse(
            home_team=home_team,
            away_team=away_team,
            matches=h2h_matches,
            stats=stats
        )
        
    except Exception as e:
        print(f"Error fetching head-to-head history: {e}")
        return HeadToHeadResponse(
            home_team=home_team,
            away_team=away_team,
            matches=[],
            stats=HeadToHeadStats(total_matches=0, home_wins=0, away_wins=0, draws=0)
        )
