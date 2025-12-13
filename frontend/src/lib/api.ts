import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// BO1: Season Rankings
export interface TeamStats {
    team: string;
    wins: number;
    draws: number;
    losses: number;
    goals_scored: number;
    goals_conceded: number;
    clean_sheets: number;
    win_rate?: number;
}

export interface SeasonRankingRequest {
    season: string;
    teams: TeamStats[];
}

export interface TeamPrediction {
    rank: number;
    team: string;
    predicted_position: number;
    raw_prediction?: number;
    confidence: string;
    actual_position?: number;
    position_diff?: number;
}

export interface SeasonRankingResponse {
    season: string;
    predictions: TeamPrediction[];
    model_metadata: {
        algorithm: string;
        mae?: number;
        r2_score?: number;
    };
    comparison?: {
        avg_position_error: number;
        exact_matches: number;
        within_1: number;
        within_3: number;
    };
}

export interface SeasonsResponse {
    seasons: string[];
    default: string;
}

export const getAvailableSeasons = async (): Promise<SeasonsResponse> => {
    const response = await api.get('/api/v1/seasons');
    return response.data;
};

export const predictSeasonRankings = async (data: SeasonRankingRequest): Promise<SeasonRankingResponse> => {
    const response = await api.post('/api/v1/predict-season', data);
    return response.data;
};

export const predictSeasonFromData = async (season: string, compareActual: boolean = false): Promise<SeasonRankingResponse> => {
    const response = await api.get(`/api/v1/predict-season/${season}`, {
        params: { compare_actual: compareActual }
    });
    return response.data;
};

// BO2: Match Prediction
export interface MatchPredictionRequest {
    home_team: string;
    away_team: string;
    season?: string;
    expert_mode?: boolean;
}

export interface MatchPredictionResponse {
    prediction: string;
    probabilities: {
        home_win: number;
        draw: number;
        away_win: number;
    };
    confidence: string;
    feature_importance?: Array<{
        feature: string;
        value: any;
        importance: number;
    }>;
    model_accuracy?: number;
}

export const predictMatch = async (data: MatchPredictionRequest): Promise<MatchPredictionResponse> => {
    const response = await api.post('/api/v1/predict-match', data);
    return response.data;
};

// Match Results & Comparison
export interface MatchResultResponse {
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string | null;
    status: string;
    actual_result: string | null;
}

export interface MatchComparisonResponse {
    home_team: string;
    away_team: string;
    predicted_result: string;
    actual_result: string | null;
    match_status: string;
    is_correct: boolean | null;
    home_score: number | null;
    away_score: number | null;
    match_date: string | null;
    confidence: string;
}

export const getMatchResult = async (homeTeam: string, awayTeam: string): Promise<MatchResultResponse> => {
    const response = await api.get('/api/v1/match-result', {
        params: { home_team: homeTeam, away_team: awayTeam }
    });
    return response.data;
};

export const compareMatchPrediction = async (
    homeTeam: string,
    awayTeam: string,
    predictedResult: string,
    confidence: string
): Promise<MatchComparisonResponse> => {
    const response = await api.get('/api/v1/match-comparison', {
        params: {
            home_team: homeTeam,
            away_team: awayTeam,
            predicted_result: predictedResult,
            confidence: confidence
        }
    });
    return response.data;
};

// Head-to-head match history
export interface HeadToHeadMatch {
    date: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    result: string | null;
    season: string;
}

export interface HeadToHeadResponse {
    home_team: string;
    away_team: string;
    matches: HeadToHeadMatch[];
    stats: {
        total_matches: number;
        home_wins: number;
        away_wins: number;
        draws: number;
    };
}

export const getHeadToHeadHistory = async (homeTeam: string, awayTeam: string): Promise<HeadToHeadResponse> => {
    const response = await api.get('/api/v1/head-to-head', {
        params: {
            home_team: homeTeam,
            away_team: awayTeam
        }
    });
    return response.data;
};

// BO3: Team Style
export interface TeamStyleResponse {
    team: string;
    season: string;
    cluster: {
        id: number;
        label: string;
        description: string;
    };
    similar_teams: string[];
    probabilities?: Record<string, number>;
    stats: Record<string, number>;
}

export const getTeamStyle = async (teamName: string, season: string = '2024-25'): Promise<TeamStyleResponse> => {
    const response = await api.get(`/api/v1/team-style/${teamName}`, {
        params: { season },
    });
    return response.data;
};

export interface AllTeamStylesResponse {
    season: string;
    total_teams: number;
    clusters: Record<string, string[]>; // style name -> teams
    styles: Array<{
        team: string;
        cluster_id: number;
        style: string;
    }>;
}

export const getAllTeamStyles = async (season: string = '2024-25'): Promise<AllTeamStylesResponse> => {
    const response = await api.get('/api/v1/team-styles/all', { params: { season } });
    return response.data;
};

// Team style history across seasons
export interface TeamSeasonStyle {
    season: string;
    cluster_id: number;
    style: string;
    stats: {
        Attack: number;
        Defense: number;
        Possession: number;
        Pressing: number;
        'Set Pieces': number;
        Discipline: number;
    };
    position?: number;
    points?: number;
}

export interface TeamStyleHistoryResponse {
    team: string;
    total_seasons: number;
    history: TeamSeasonStyle[];
}

export const getTeamStyleHistory = async (teamName: string): Promise<TeamStyleHistoryResponse> => {
    const response = await api.get(`/api/v1/team-style-history/${teamName}`);
    return response.data;
};

// Model info endpoints (expert mode panels)
export interface ModelInfo {
    business_objective: string;
    algorithm: string;
    features: string[];
    performance?: Record<string, any>;
    version?: string;
    num_clusters?: number;
    cluster_labels?: Record<number, string>;
    limitations?: string[];
    position?: string; // for BO4
    filters?: Record<string, any>;
}

export const getModelInfo = async (bo: 'bo1' | 'bo2' | 'bo3' | 'bo5'): Promise<ModelInfo> => {
    const response = await api.get(`/api/v1/model-info/${bo}`);
    return response.data;
};

export const getBo4ModelInfo = async (position: string): Promise<ModelInfo> => {
    const response = await api.get('/api/v1/model-info/bo4', { params: { position } });
    return response.data;
};

// BO4: Player Recommendations
export interface PlayerRecommendation {
    rank: number;
    player: string;
    squad: string;
    league?: string;
    age: number;
    market_value?: number;
    predicted_score: number;
    stats: Record<string, any>;
}

export interface PlayerRecommendationsResponse {
    position: string;
    filters: {
        max_age: number;
        limit: number;
    };
    recommendations: PlayerRecommendation[];
}

export const getPlayerRecommendations = async (
    position: string,
    limit: number = 10,
    maxAge?: number
): Promise<PlayerRecommendationsResponse> => {
    const response = await api.get('/api/v1/players/recommendations', {
        params: { position, limit, max_age: maxAge },
    });
    return response.data;
};

export interface PlayerPositionsResponse {
    positions: Array<{ name: string; max_age_default: number; description: string }>;
}

export const getPlayerPositions = async (): Promise<PlayerPositionsResponse> => {
    const response = await api.get('/api/v1/players/positions');
    return response.data;
};

// BO5: News Credibility Classification
export interface NewsCredibilityResponse {
    title: string;
    predicted_tier: number;
    tier_label: string;
    confidence: number;
    probabilities: {
        tier_1: number;
        tier_2: number;
        tier_3: number;
        tier_4: number;
    };
    credibility_description: string;
}

export const classifyNews = async (title: string, text: string): Promise<NewsCredibilityResponse> => {
    const response = await api.post('/api/v1/classify-news', {}, {
        params: { title, text }
    });
    return response.data;
};

// Get 2025-26 season forecast
export const getForecast202526 = async (): Promise<SeasonRankingResponse> => {
    const response = await api.get('/api/v1/forecast-2025-26');
    return response.data;
};

// Get next season forecast
export const getNextSeasonForecast = async () => {
    const response = await api.get('/api/v1/forecast-next-season');
    return response.data;
};

// Get all teams
export const getTeams = async (): Promise<string[]> => {
    const response = await api.get('/api/v1/teams');
    return response.data.teams;
};

