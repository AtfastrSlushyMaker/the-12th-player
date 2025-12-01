import { useEffect, useState } from 'react';
import { getAvailableSeasons, predictSeasonFromData, getModelInfo, type SeasonRankingResponse, type ModelInfo } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { RefreshCcw, TrendingUp, Trophy, Target, CheckCircle } from 'lucide-react';
import ExpertPanel from '@/components/ExpertPanel';
import { getTeamLogo } from '@/lib/teamLogos';

export default function SeasonRankings() {
  const { expertMode } = useAppStore();
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [compareActual, setCompareActual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [data, setData] = useState<SeasonRankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available seasons on mount
  useEffect(() => {
    getAvailableSeasons()
      .then(res => {
        setSeasons(res.seasons);
        setSelectedSeason(res.default);
      })
      .catch(() => setError('Failed to load available seasons'));
  }, []);

  useEffect(() => {
    if (expertMode) {
      getModelInfo('bo1').then(setModelInfo).catch(() => {});
    }
  }, [expertMode]);

  const generatePredictions = async () => {
    if (!selectedSeason) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await predictSeasonFromData(selectedSeason, compareActual);
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl pl-gradient-primary mb-6 shadow-2xl shadow-[#0b6623]/30">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pl-gradient-text">Season Rankings</h1>
        <p className="text-xl text-muted-green max-w-2xl mx-auto">
          Predict final league standings using KNN regression on real historical data
        </p>
      </div>

      {/* Season Selector */}
      <div className="glass-card p-8 mb-8 animate-slide-up">
        <div className="grid md:grid-cols-3 gap-6 items-end">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-muted-green uppercase tracking-wide">
              <Target className="w-4 h-4 stat-green" />
              Select Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="input-glass text-lg font-semibold"
            >
              {seasons.map(season => (
                <option key={season} value={season} className="bg-white text-[#0d1b0d]">
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={compareActual}
                onChange={(e) => setCompareActual(e.target.checked)}
                className="w-5 h-5 rounded border-[#0b6623]/30 text-[#0b6623] focus:ring-[#2ecc71]"
              />
              <span className="text-sm font-medium text-muted-green">Compare with actual results</span>
            </label>
          </div>

          <button
            onClick={generatePredictions}
            disabled={loading || !selectedSeason}
            className="pl-btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {loading ? 'Predicting...' : 'Generate Predictions'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Comparison Stats */}
      {data?.comparison && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-black stat-green">{data.comparison.avg_position_error}</div>
            <div className="text-xs text-muted-green mt-1">Avg Position Error</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-black stat-green">{data.comparison.exact_matches}</div>
            <div className="text-xs text-muted-green mt-1">Exact Matches</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-black stat-green">{data.comparison.within_1}</div>
            <div className="text-xs text-muted-green mt-1">Within ±1 Position</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-3xl font-black stat-green">{data.comparison.within_3}</div>
            <div className="text-xs text-muted-green mt-1">Within ±3 Positions</div>
          </div>
        </div>
      )}

      {/* Zone Legend */}
      {data && (
        <div className="flex flex-wrap gap-4 mb-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-muted-green">Champions League (1-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-muted-green">Europa League (5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-muted-green">Conference League (6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-muted-green">Relegation (18-20)</span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {data && (
        <div className="overflow-x-auto glass-card animate-slide-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-green text-xs uppercase tracking-wide border-b border-[#0b6623]/15">
                <th className="p-4">Team</th>
                <th className="p-4">Predicted Rank</th>
                {compareActual && <th className="p-4">Actual Position</th>}
                {compareActual && <th className="p-4">Diff</th>}
                <th className="p-4">Zone</th>
                {expertMode && <th className="p-4">Raw Model Score</th>}
                {expertMode && <th className="p-4">Algorithm</th>}
              </tr>
            </thead>
            <tbody>
              {data.predictions.sort((a,b) => a.rank - b.rank).map(row => {
                // Determine zone based on predicted position
                const getZone = (rank: number) => {
                  if (rank <= 4) return { label: 'Champions League', color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' };
                  if (rank === 5) return { label: 'Europa League', color: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500' };
                  if (rank === 6) return { label: 'Conference League', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
                  if (rank >= 18) return { label: 'Relegation', color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' };
                  return { label: 'Mid-Table', color: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400' };
                };
                const zone = getZone(row.rank);
                
                // Row border color based on zone
                const getRowBorder = (rank: number) => {
                  if (rank <= 4) return 'border-l-4 border-l-blue-500';
                  if (rank === 5) return 'border-l-4 border-l-orange-500';
                  if (rank === 6) return 'border-l-4 border-l-emerald-500';
                  if (rank >= 18) return 'border-l-4 border-l-red-500';
                  return '';
                };
                
                return (
                  <tr key={row.team} className={`border-t border-[#0b6623]/10 hover:bg-[#f0fff0] transition-colors ${getRowBorder(row.rank)}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={getTeamLogo(row.team)} alt={row.team} className="w-6 h-6 object-contain" />
                        {row.rank <= 3 && <Trophy className={`w-4 h-4 ${row.rank === 1 ? 'text-yellow-500' : row.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />}
                        <span className="font-semibold">{row.team}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold stat-green text-lg">{row.predicted_position}</span>
                    </td>
                    {compareActual && (
                      <td className="p-4 font-medium">
                        {row.actual_position !== undefined ? row.actual_position : '-'}
                      </td>
                    )}
                    {compareActual && (
                      <td className="p-4">
                        {row.position_diff !== undefined ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                            row.position_diff === 0 ? 'bg-green-100 text-green-700' :
                            row.position_diff <= 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {row.position_diff === 0 && <CheckCircle className="w-3 h-3" />}
                            {row.position_diff === 0 ? 'Exact' : `±${row.position_diff}`}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${zone.color}`}>
                        <span className={`w-2 h-2 rounded-full ${zone.dot}`}></span>
                        {zone.label}
                      </span>
                    </td>
                    {expertMode && (
                      <td className="p-4 text-muted-green text-sm">{row.raw_prediction?.toFixed(2) || '-'}</td>
                    )}
                    {expertMode && (
                      <td className="p-4 text-xs text-muted-green">{data.model_metadata.algorithm}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!data && !loading && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Trophy className="w-16 h-16 text-[#0b6623]/30 mx-auto mb-4" />
          <p className="text-muted-green text-lg">
            Select a season and click "Generate Predictions" to see model predictions
          </p>
        </div>
      )}

      <ExpertPanel title="Season Rankings Model Details" info={modelInfo} loading={expertMode && !modelInfo}>
        <p className="text-xs text-muted-green leading-relaxed">
          This model uses KNN Regression trained on {seasons.length}+ seasons of Premier League data. 
          It predicts final league positions based on team statistics like wins, goals scored, and clean sheet rate.
        </p>
      </ExpertPanel>
    </div>
  );
}