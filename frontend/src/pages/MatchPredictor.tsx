import { useState } from 'react';
import { Zap, TrendingUp, Award, Shield, Swords } from 'lucide-react';
import { predictMatch, type MatchPredictionRequest, type MatchPredictionResponse } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import { getTeamLogo } from '@/lib/teamLogos';

export default function MatchPredictor() {
    const { expertMode } = useAppStore();
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<MatchPredictionResponse | null>(null);

    const teams = [
        'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
        'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
        'Leicester', 'Liverpool', 'Man City', 'Man United', 'Newcastle',
        'Nottingham Forest', 'Southampton', 'Tottenham', 'West Ham', 'Wolves'
    ];

    const handlePredict = async () => {
        if (!homeTeam || !awayTeam) {
            setError('Please select both teams');
            return;
        }

        if (homeTeam === awayTeam) {
            setError('Please select different teams');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const request: MatchPredictionRequest = {
                home_team: homeTeam,
                away_team: awayTeam,
                season: '2025-26',
                expert_mode: expertMode,
            };

            const prediction = await predictMatch(request);
            setResult(prediction);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to predict match outcome');
        } finally {
            setLoading(false);
        }
    };

    const getOutcomeColor = (outcome: string) => {
        if (outcome === 'Home Win') return { bg: 'from-[#0b6623] to-[#2ecc71]', text: 'stat-green', border: 'border-[#0b6623]/40' };
        if (outcome === 'Draw') return { bg: 'from-[#2ecc71] to-[#0b6623]', text: 'text-muted-green', border: 'border-[#2ecc71]/40' };
        return { bg: 'from-[#0b6623] via-[#2ecc71] to-[#0b6623]', text: 'stat-green', border: 'border-[#0b6623]/30' };
    };

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl pl-gradient-primary mb-6 shadow-2xl shadow-[#0b6623]/30">
                        <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pl-gradient-text">Match Predictor</h1>
                    <p className="text-xl text-muted-green max-w-2xl mx-auto">
                        AI-powered match outcome predictions using Random Forest classification
                    </p>
                </div>

                {/* Team Selection */}
                <div className="glass-card p-8 md:p-10 mb-8 animate-slide-up">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Home Team */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-muted-green uppercase tracking-wide">
                                <Shield className="w-4 h-4 stat-green" />
                                Home Team
                            </label>
                            <select
                                value={homeTeam}
                                onChange={(e) => setHomeTeam(e.target.value)}
                                className="input-glass text-lg font-semibold"
                            >
                                <option value="" className="bg-white text-[#0d1b0d]">Select home team...</option>
                                {teams.map((team) => (
                                    <option key={team} value={team} className="bg-white text-[#0d1b0d]">
                                        {team}
                                    </option>
                                ))}
                            </select>
                            {homeTeam && (
                                <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-[#e9f9ec] border border-[#0b6623]/15">
                                    <img src={getTeamLogo(homeTeam)} alt={homeTeam} className="w-10 h-10 object-contain" />
                                    <span className="font-bold stat-green">{homeTeam}</span>
                                </div>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-muted-green uppercase tracking-wide">
                                <Shield className="w-4 h-4 stat-green" />
                                Away Team
                            </label>
                            <select
                                value={awayTeam}
                                onChange={(e) => setAwayTeam(e.target.value)}
                                className="input-glass text-lg font-semibold"
                            >
                                <option value="" className="bg-white text-[#0d1b0d]">Select away team...</option>
                                {teams.map((team) => (
                                    <option key={team} value={team} className="bg-white text-[#0d1b0d]">
                                        {team}
                                    </option>
                                ))}
                            </select>
                            {awayTeam && (
                                <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-[#e9f9ec] border border-[#0b6623]/15">
                                    <img src={getTeamLogo(awayTeam)} alt={awayTeam} className="w-10 h-10 object-contain" />
                                    <span className="font-bold stat-green">{awayTeam}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handlePredict}
                        disabled={loading || !homeTeam || !awayTeam}
                        className="w-full mt-8 px-8 py-5 rounded-2xl font-bold text-lg pl-gradient-primary hover:brightness-110 transform hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-[#0b6623]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Analyzing Match...
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6" />
                                Predict Match Outcome
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && <ErrorMessage message={error} retry={handlePredict} />}

                {/* Loading */}
                {loading && <Loading message="Crunching the numbers..." />}

                {/* Results */}
                {result && (
                    <div className="space-y-8 animate-slide-up">
                        {/* Main Prediction Card */}
                        <div className={`relative overflow-hidden glass-card border-2 ${getOutcomeColor(result.prediction).border}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${getOutcomeColor(result.prediction).bg} opacity-5`}></div>

                            <div className="relative p-10 text-center">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card mb-6 border border-[#0b6623]/20">
                                    <Award className="w-5 h-5 stat-green" />
                                    <span className="text-sm font-semibold">AI Prediction</span>
                                </div>

                                <h2 className={`text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r ${getOutcomeColor(result.prediction).bg} bg-clip-text text-transparent`}>
                                    {result.prediction}
                                </h2>

                                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#e9f9ec] border border-[#0b6623]/15">
                                    <span className="text-muted-green">Confidence:</span>
                                    <span className={`text-xl font-bold uppercase tracking-wide ${getOutcomeColor(result.prediction).text}`}>
                                        {result.confidence}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Probabilities Grid - Expert Mode Only */}
                        {expertMode && (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Home Win', value: result.probabilities.home_win, color: 'bg-[#0b6623]', textColor: 'stat-green', icon: Shield },
                                    { label: 'Draw', value: result.probabilities.draw, color: 'bg-[#c9a227]', textColor: 'stat-gold', icon: Swords },
                                    { label: 'Away Win', value: result.probabilities.away_win, color: 'bg-[#2ecc71]', textColor: 'stat-green', icon: Shield },
                                ].map((prob) => (
                                    <div key={prob.label} className="glass-card p-6 hover:bg-white transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <prob.icon className="w-6 h-6 stat-green group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-semibold text-muted-green">{prob.label}</span>
                                        </div>
                                        <div className={`text-5xl font-black mb-4 ${prob.textColor}`}>
                                            {(prob.value * 100).toFixed(1)}%
                                        </div>
                                        <div className="h-3 bg-[#e9f9ec] rounded-full overflow-hidden border border-[#0b6623]/10">
                                            <div
                                                className={`h-full ${prob.color} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${prob.value * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Expert Mode - Feature Importance */}
                        {expertMode && result.feature_importance && (
                            <div className="glass-card p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-6 h-6 stat-green" />
                                    <h3 className="text-2xl font-bold stat-green">
                                        Feature Importance Analysis
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {result.feature_importance.slice(0, 10).map((feature, index) => (
                                        <div key={index} className="group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-muted-green group-hover:text-[#0d1b0d] transition-colors">
                                                    {feature.feature}
                                                </span>
                                                <span className="text-sm font-bold stat-green">
                                                    {(feature.importance * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[#e9f9ec] rounded-full overflow-hidden border border-[#0b6623]/10">
                                                <div
                                                    className="h-full pl-gradient-primary rounded-full transition-all duration-700"
                                                    style={{ width: `${feature.importance * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {result.model_accuracy && (
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="glass-card p-4">
                                                <div className="text-sm text-muted-green mb-1">Model Accuracy</div>
                                                <div className="text-2xl font-bold stat-green">{(result.model_accuracy * 100).toFixed(1)}%</div>
                                            </div>
                                            <div className="glass-card p-4">
                                                <div className="text-sm text-muted-green mb-1">Algorithm</div>
                                                <div className="text-2xl font-bold stat-green">Random Forest</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Model Info Card */}
                        <div className="glass-card p-6">
                            <h4 className="text-sm font-bold text-muted-green uppercase tracking-wide mb-4">Model Performance</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-xs text-muted-green mb-1">Overall Accuracy</div>
                                    <div className="text-xl font-bold stat-green">59.2%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-green mb-1">Home Wins</div>
                                    <div className="text-xl font-bold stat-gold">60%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-green mb-1">Away Wins</div>
                                    <div className="text-xl font-bold stat-gold">67%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-green mb-1">Draws</div>
                                    <div className="text-xl font-bold stat-gold">21%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!result && !loading && !error && (
                    <div className="glass-card p-12 text-center animate-fade-in">
                        <Zap className="w-16 h-16 text-[#0b6623]/30 mx-auto mb-4" />
                        <p className="text-muted-green text-lg">
                            Select two teams above to get started with match prediction
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
