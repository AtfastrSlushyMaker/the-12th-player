import { useEffect, useState } from 'react';
import { getTeams, getTeamStyle, getTeamStyleHistory, getModelInfo, getAvailableSeasons, type TeamStyleResponse, type TeamStyleHistoryResponse, type ModelInfo } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { Search, Compass, RefreshCcw, Target, Calendar, Trophy } from 'lucide-react';
import ExpertPanel from '@/components/ExpertPanel';
import { getTeamLogo } from '@/lib/teamLogos';

// Hexagon Radar Chart Component
function HexagonRadar({ stats, size = 200 }: { stats: Record<string, number>; size?: number }) {
  const center = size / 2;
  const radius = size * 0.4;
  const labels = Object.keys(stats);
  const values = Object.values(stats);
  const angleStep = (2 * Math.PI) / labels.length;

  // Generate points for the outer hexagon
  const outerPoints = labels.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  // Generate points for the data polygon
  const dataPoints = values.map((val, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (val / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  // Generate grid lines (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      {/* Background */}
      <circle cx={center} cy={center} r={radius + 10} fill="#f4fff4" />

      {/* Grid circles */}
      {gridLevels.map((level, i) => (
        <polygon
          key={i}
          points={labels
            .map((_, j) => {
              const angle = j * angleStep - Math.PI / 2;
              const r = level * radius;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ')}
          fill="none"
          stroke="#0b6623"
          strokeWidth="1"
          opacity={0.15}
        />
      ))}

      {/* Axis lines */}
      {outerPoints.map((point, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="#0b6623"
          strokeWidth="1"
          opacity={0.2}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="url(#radarGradient)"
        stroke="#0b6623"
        strokeWidth="2"
        opacity={0.8}
      />

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="#0b6623"
          stroke="#ffffff"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {labels.map((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-semibold fill-[#0b6623]"
          >
            {label}
          </text>
        );
      })}

      {/* Values */}
      {values.map((val, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius * 0.6;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={`val-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-bold fill-[#c9a227]"
          >
            {Math.round(val)}
          </text>
        );
      })}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b6623" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2ecc71" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Style color map
const styleColors: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  'Attacking': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hex: '#a855f7' },
  'Defensive': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', hex: '#f87171' },
  'Possession': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hex: '#c084fc' },
  'High-Press': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', hex: '#4ade80' },
  'Pragmatic': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', hex: '#fbbf24' },
};

// Cluster order for Y-axis (bottom to top)
const clusterOrder = ['Defensive', 'Pragmatic', 'High-Press', 'Possession', 'Attacking'];
const clusterBgColors = ['#fee2e2', '#fef9c3', '#dcfce7', '#f3e8ff', '#ede9fe'];

// Tactical Evolution Timeline Component (like the image)
function TacticalEvolutionTimeline({ 
  history, 
  currentSeason, 
  onSeasonSelect,
  teamName
}: { 
  history: Array<{ season: string; style: string; cluster_id: number; position?: number }>;
  currentSeason: string;
  onSeasonSelect: (season: string) => void;
  teamName: string;
}) {
  if (!history || history.length === 0) return null;

  // Count style changes
  let styleChanges = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].style !== history[i-1].style) styleChanges++;
  }

  const chartHeight = 280;
  const chartPadding = { top: 40, right: 30, bottom: 50, left: 100 };
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const rowHeight = plotHeight / clusterOrder.length;

  // Calculate positions
  const getYPosition = (style: string) => {
    const index = clusterOrder.indexOf(style);
    return chartPadding.top + plotHeight - (index + 0.5) * rowHeight;
  };

  const seasonWidth = Math.max(50, 900 / history.length);
  const chartWidth = chartPadding.left + history.length * seasonWidth + chartPadding.right;

  return (
    <div className="w-full">
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold stat-green">{teamName} - Tactical Evolution ({styleChanges} style changes)</h3>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          {/* Background bands for each cluster */}
          {clusterOrder.map((cluster, i) => (
            <rect
              key={cluster}
              x={chartPadding.left}
              y={chartPadding.top + plotHeight - (i + 1) * rowHeight}
              width={chartWidth - chartPadding.left - chartPadding.right}
              height={rowHeight}
              fill={clusterBgColors[i]}
              opacity={0.5}
            />
          ))}

          {/* Y-axis labels */}
          {clusterOrder.map((cluster, i) => {
            const y = chartPadding.top + plotHeight - (i + 0.5) * rowHeight;
            return (
              <g key={cluster}>
                <text
                  x={chartPadding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[10px] font-semibold fill-gray-600"
                >
                  Cluster {clusterOrder.length - 1 - i}
                </text>
                <text
                  x={chartPadding.left - 10}
                  y={y + 12}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[9px] fill-gray-500"
                >
                  ({cluster})
                </text>
              </g>
            );
          })}

          {/* Y-axis title */}
          <text
            x={15}
            y={chartHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
            className="text-[11px] font-semibold fill-gray-600"
          >
            Playing Style Cluster
          </text>

          {/* Connecting lines between points */}
          {history.map((h, i) => {
            if (i === 0) return null;
            const prev = history[i - 1];
            const x1 = chartPadding.left + (i - 1) * seasonWidth + seasonWidth / 2;
            const y1 = getYPosition(prev.style);
            const x2 = chartPadding.left + i * seasonWidth + seasonWidth / 2;
            const y2 = getYPosition(h.style);
            const color = styleColors[prev.style]?.hex || '#888';
            
            return (
              <line
                key={`line-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={2}
                opacity={0.7}
              />
            );
          })}

          {/* Data points */}
          {history.map((h, i) => {
            const x = chartPadding.left + i * seasonWidth + seasonWidth / 2;
            const y = getYPosition(h.style);
            const color = styleColors[h.style]?.hex || '#888';
            const isSelected = h.season === currentSeason;
            
            return (
              <g key={h.season} className="cursor-pointer" onClick={() => onSeasonSelect(h.season)}>
                {/* Outer ring for selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill="none"
                    stroke="#0b6623"
                    strokeWidth={2}
                  />
                )}
                
                {/* Main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  className="hover:opacity-80 transition-opacity"
                />

                {/* Style label */}
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  className="text-[8px] fill-gray-700 font-medium"
                >
                  {h.style}
                </text>
              </g>
            );
          })}

          {/* X-axis labels (seasons) */}
          {history.map((h, i) => {
            const x = chartPadding.left + i * seasonWidth + seasonWidth / 2;
            return (
              <text
                key={`label-${h.season}`}
                x={x}
                y={chartHeight - 15}
                textAnchor="middle"
                className="text-[9px] fill-gray-600 font-medium"
                transform={`rotate(-45, ${x}, ${chartHeight - 15})`}
              >
                {h.season}
              </text>
            );
          })}

          {/* X-axis title */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 2}
            textAnchor="middle"
            className="text-[11px] font-semibold fill-gray-600"
          >
            Season
          </text>
        </svg>
      </div>
    </div>
  );
}

export default function TeamStyles() {
  const { expertMode } = useAppStore();
  const [seasons, setSeasons] = useState<string[]>([]);
  const [season, setSeason] = useState('2024-25');
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('Arsenal');
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [teamStyle, setTeamStyle] = useState<TeamStyleResponse | null>(null);
  const [teamHistory, setTeamHistory] = useState<TeamStyleHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    getTeams().then(setTeams);
    getAvailableSeasons()
      .then((res) => {
        setSeasons(res.seasons);
        setSeason(res.default);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (expertMode) getModelInfo('bo3').then(setModelInfo).catch(() => {});
  }, [expertMode]);

  const fetchTeamData = async () => {
    setLoadingTeam(true);
    setLoadingHistory(true);
    setError(null);

    try {
      const [styleRes, historyRes] = await Promise.all([
        getTeamStyle(selectedTeam, season),
        getTeamStyleHistory(selectedTeam),
      ]);
      setTeamStyle(styleRes);
      setTeamHistory(historyRes);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to fetch team data');
    } finally {
      setLoadingTeam(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedTeam && season) {
      fetchTeamData();
    }
  }, [selectedTeam, season]);

  // Get current season stats for hexagon
  const currentSeasonData = teamHistory?.history.find((h) => h.season === season);
  const hexagonStats = currentSeasonData?.stats || teamStyle?.stats
    ? {
        Attack: currentSeasonData?.stats?.Attack ?? Math.min((teamStyle?.stats?.Avg_Goals_Scored || 0) / 3 * 100, 100),
        Defense: currentSeasonData?.stats?.Defense ?? Math.min((1 - (teamStyle?.stats?.Avg_Goals_Conceded || 2) / 3) * 100, 100),
        Possession: currentSeasonData?.stats?.Possession ?? (teamStyle?.stats?.Shot_Accuracy || 0),
        Pressing: currentSeasonData?.stats?.Pressing ?? Math.min((teamStyle?.stats?.Fouls_per_Match || 0) / 15 * 100, 100),
        'Set Pieces': currentSeasonData?.stats?.['Set Pieces'] ?? Math.min((teamStyle?.stats?.Avg_Corners || 0) / 10 * 100, 100),
        Discipline: currentSeasonData?.stats?.Discipline ?? Math.min((1 - (teamStyle?.stats?.Cards_per_Foul || 0)) * 100, 100),
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl pl-gradient-primary mb-6 shadow-2xl shadow-[#0b6623]/30">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pl-gradient-text">Team Styles</h1>
        <p className="text-xl text-muted-green max-w-2xl mx-auto">
          Discover tactical patterns and playing style evolution using KMeans clustering
        </p>
      </div>

      {/* Team Selector */}
      <div className="glass-card p-6 mb-8 animate-slide-up">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 stat-green" />
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#0b6623]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#0b6623]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
          >
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button onClick={fetchTeamData} disabled={loadingTeam} className="pl-btn-primary flex items-center gap-2">
            {loadingTeam ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loadingTeam ? 'Loading...' : 'Analyze Team'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* Main Content */}
      {teamStyle && (
        <div className="space-y-8 mb-10 animate-fade-in">
          {/* Top Row: Hexagon + Season List */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Hexagon Radar Chart */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={getTeamLogo(teamStyle.team)} alt={teamStyle.team} className="w-12 h-12 object-contain" />
                <div>
                  <h2 className="text-xl font-bold stat-green">{teamStyle.team}</h2>
                  <p className="text-sm text-muted-green">Style Profile • {season}</p>
                </div>
              </div>

              {/* Style Badge */}
              <div className="flex justify-center mb-6">
                <div
                  className={`px-4 py-2 rounded-xl border-2 ${
                    styleColors[teamStyle.cluster.label]?.bg || 'bg-[#e9f9ec]'
                  } ${styleColors[teamStyle.cluster.label]?.border || 'border-[#0b6623]/20'}`}
                >
                  <span
                    className={`font-bold ${styleColors[teamStyle.cluster.label]?.text || 'stat-green'}`}
                  >
                    {teamStyle.cluster.label}
                  </span>
                </div>
              </div>

              {/* Hexagon Chart */}
              <div className="flex justify-center">
                {hexagonStats && <HexagonRadar stats={hexagonStats} size={280} />}
              </div>

              {/* Description */}
              <p className="text-center text-sm text-muted-green mt-6">{teamStyle.cluster.description}</p>

              {/* Similar Teams */}
              <div className="mt-6 pt-6 border-t border-[#0b6623]/10">
                <div className="text-xs uppercase tracking-wide text-muted-green mb-3">Similar Teams</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {teamStyle.similar_teams.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTeam(t)}
                      className="px-3 py-1.5 rounded-lg bg-[#e9f9ec] text-[#0b6623] text-sm font-medium hover:bg-white transition-colors border border-[#0b6623]/15 flex items-center gap-2"
                    >
                      <img src={getTeamLogo(t)} alt={t} className="w-5 h-5 object-contain" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Season List */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl pl-gradient-primary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold stat-green">Season History</h2>
                  <p className="text-sm text-muted-green">
                    {teamHistory?.total_seasons || 0} seasons in Premier League
                  </p>
                </div>
              </div>

              {/* Season List */}
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCcw className="w-6 h-6 animate-spin text-[#0b6623]" />
                </div>
              ) : teamHistory?.history && teamHistory.history.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {teamHistory.history
                    .slice()
                    .reverse()
                    .map((h) => {
                      const isCurrentSeason = h.season === season;
                      const colors = styleColors[h.style] || styleColors['Pragmatic'];
                      return (
                        <div
                          key={h.season}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${
                            isCurrentSeason
                              ? 'bg-[#e9f9ec] border-2 border-[#0b6623]'
                              : 'bg-white border border-[#0b6623]/10 hover:bg-[#f4fff4]'
                          }`}
                          onClick={() => setSeason(h.season)}
                        >
                          {/* Season */}
                          <div className="w-20 text-sm font-bold stat-green">{h.season}</div>

                          {/* Style Badge */}
                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}
                          >
                            {h.style}
                          </div>

                          {/* Position */}
                          {h.position && (
                            <div className="flex items-center gap-1 ml-auto">
                              {h.position <= 4 && <Trophy className="w-3 h-3 text-[#c9a227]" />}
                              <span className="text-sm font-medium text-muted-green">
                                {h.position}
                                {h.position === 1 ? 'st' : h.position === 2 ? 'nd' : h.position === 3 ? 'rd' : 'th'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-green">No historical data available</div>
              )}
            </div>
          </div>

          {/* Bottom: Tactical Evolution Timeline Chart */}
          <div className="glass-card p-8">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="w-6 h-6 animate-spin text-[#0b6623]" />
              </div>
            ) : teamHistory?.history && teamHistory.history.length > 0 ? (
              <TacticalEvolutionTimeline 
                history={teamHistory.history} 
                currentSeason={season}
                onSeasonSelect={setSeason}
                teamName={selectedTeam}
              />
            ) : (
              <div className="text-center py-12 text-muted-green">No historical data available</div>
            )}
          </div>
        </div>
      )}

      {/* Expert Mode - Probabilities & Stats */}
      {expertMode && teamStyle && (
        <div className="glass-card p-8 mb-10 animate-fade-in">
          <h3 className="text-lg font-bold stat-green mb-6">Cluster Probabilities & Raw Stats</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Probabilities */}
            {teamStyle.probabilities && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-green mb-3">Style Probabilities</div>
                <div className="space-y-3">
                  {Object.entries(teamStyle.probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, val]) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-28 text-sm font-medium truncate">{label}</div>
                        <div className="flex-1 h-3 rounded-full bg-[#e9f9ec] overflow-hidden border border-[#0b6623]/10">
                          <div
                            className="h-full pl-gradient-primary rounded-full transition-all"
                            style={{ width: `${(val * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <div className="w-14 text-sm tabular-nums stat-green font-semibold">
                          {(val * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Raw Stats */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-green mb-3">Underlying Statistics</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(teamStyle.stats)
                  .slice(0, 12)
                  .map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-[#e9f9ec] border border-[#0b6623]/10">
                      <div className="text-[10px] uppercase tracking-wide text-muted-green truncate">{k}</div>
                      <div className="font-semibold text-sm stat-green">
                        {typeof v === 'number' ? v.toFixed(2) : v}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!teamStyle && !loadingTeam && !error && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Compass className="w-16 h-16 text-[#0b6623]/30 mx-auto mb-4" />
          <p className="text-muted-green text-lg">Select a team to analyze their tactical style</p>
        </div>
      )}

      <ExpertPanel title="Team Styles Model Details" info={modelInfo} loading={expertMode && !modelInfo}>
        <p className="text-xs text-muted-green leading-relaxed">
          KMeans clustering with 5 tactical styles. Cluster probabilities derived from inverse-distance weighting in
          feature space.
        </p>
      </ExpertPanel>
    </div>
  );
}