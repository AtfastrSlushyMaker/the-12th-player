import { useEffect, useState } from 'react';
import { getPlayerPositions, getPlayerRecommendations, getBo4ModelInfo, type PlayerPositionsResponse, type PlayerRecommendationsResponse, type ModelInfo } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { Users, Filter, RefreshCcw, Star } from 'lucide-react';
import ExpertPanel from '@/components/ExpertPanel';
import { getTeamLogo, getLeagueLogo } from '@/lib/teamLogos';

// Format market value
function formatValue(value: number): string {
  if (!value || value === 0) return 'N/A';
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value}`;
}

export default function PlayerScout() {
  const { expertMode } = useAppStore();
  const [positions, setPositions] = useState<PlayerPositionsResponse | null>(null);
  const [position, setPosition] = useState<string>('Forward');
  const [maxAge, setMaxAge] = useState<number>(25);
  const [limit, setLimit] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PlayerRecommendationsResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getPlayerPositions().then(setPositions).catch(()=>{}); }, []);

  const fetchModelInfo = async (pos: string) => {
    if (!expertMode) return;
    setInfoLoading(true);
    try { const info = await getBo4ModelInfo(pos); setModelInfo(info); }
    catch { /* ignore */ }
    finally { setInfoLoading(false); }
  };

  const runSearch = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getPlayerRecommendations(position, limit, maxAge);
      setRecommendations(res);
    } catch (e:any) {
      setError(e?.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
    fetchModelInfo(position);
  };

  useEffect(() => { runSearch(); }, []); // initial

  // Get max score for normalization
  const maxScore = recommendations?.recommendations?.length 
    ? Math.max(...recommendations.recommendations.map(r => r.predicted_score))
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl pl-gradient-primary mb-6 shadow-2xl shadow-[#0b6623]/30">
          <Star className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pl-gradient-text">Player Scout</h1>
        <p className="text-xl text-muted-green max-w-2xl mx-auto">
          Discover rising talent with LightGBM-powered performance predictions
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-slide-up">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-green">Position:</label>
            <select 
              value={position} 
              onChange={(e) => setPosition(e.target.value)} 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#0b6623]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
            >
              {positions?.positions.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-green">Max Age:</label>
            <input 
              type="number" 
              min={16} 
              max={40} 
              value={maxAge} 
              onChange={(e) => setMaxAge(Number(e.target.value))} 
              className="w-16 px-3 py-2.5 rounded-xl bg-white border border-[#0b6623]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-green">Show:</label>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))} 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#0b6623]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
            >
              <option value={6}>6 players</option>
              <option value={12}>12 players</option>
              <option value={20}>20 players</option>
              <option value={30}>30 players</option>
            </select>
          </div>
          
          <button
            onClick={runSearch}
            disabled={loading}
            className="pl-btn-primary flex items-center gap-2"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-100 text-red-700 text-sm">{error}</div>}

      {/* Player Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {recommendations?.recommendations.map(rec => {
          const normalizedScore = (rec.predicted_score / maxScore) * 100;
          
          return (
            <div key={`${rec.player}-${rec.rank}`} className="glass-card p-5 flex flex-col hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img src={getTeamLogo(rec.squad)} alt={rec.squad} className="w-10 h-10 object-contain" />
                  <div>
                    <div className="font-bold text-sm stat-green">{rec.player}</div>
                    <div className="text-xs text-muted-green">{rec.squad}</div>
                    {rec.league && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <img src={getLeagueLogo(rec.league)} alt={rec.league} className="w-3 h-3 object-contain" />
                        <span className="text-[10px] text-[#5a6b5a]">{rec.league}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs px-2 py-1 rounded-lg bg-[#0b6623] text-white font-bold">#{rec.rank}</span>
                </div>
              </div>
              
              {/* Player Info */}
              <div className="flex items-center gap-4 text-xs text-muted-green mb-4">
                <span>Age <span className="font-bold stat-green">{rec.age}</span></span>
                <span>•</span>
                <span className="font-medium stat-gold">{formatValue(rec.market_value ?? 0)}</span>
              </div>
              
              {/* Score Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wide text-muted-green">Model Score</span>
                  <span className="text-sm font-bold stat-green">{rec.predicted_score.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e9f9ec] overflow-hidden border border-[#0b6623]/10">
                  <div 
                    className="h-full pl-gradient-primary rounded-full transition-all duration-500" 
                    style={{ width: `${normalizedScore}%` }} 
                  />
                </div>
              </div>
              
              {/* Stats Grid - Always show key stats */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {Object.entries(rec.stats).slice(0, expertMode ? 8 : 4).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-[#e9f9ec] border border-[#0b6623]/10">
                    <div className="text-[9px] uppercase tracking-wide text-muted-green truncate">{k}</div>
                    <div className="font-semibold text-xs stat-green">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!recommendations?.recommendations?.length && !loading && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Users className="w-16 h-16 text-[#0b6623]/30 mx-auto mb-4" />
          <p className="text-muted-green text-lg">No players found matching your criteria</p>
        </div>
      )}

      <ExpertPanel title={`${position} Model Details`} info={modelInfo} loading={expertMode && infoLoading}>
        <p className="text-xs text-muted-green leading-relaxed">
          LightGBM regressor trained on player performance data. Higher scores indicate better predicted performance for the position.
        </p>
      </ExpertPanel>
    </div>
  );
}