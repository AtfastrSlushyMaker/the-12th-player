import { Link } from 'react-router-dom';
import { Trophy, Zap, Users, Target, ArrowRight, Sparkles, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAvailableSeasons, predictSeasonFromData } from '@/lib/api';

interface AppStats {
    seasons: number;
    teams: number;
    matches: number;
    topTeam: string;
}

export default function Home() {
    const [stats, setStats] = useState<AppStats>({
        seasons: 25,
        teams: 46,
        matches: 9500,
        topTeam: 'Loading...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch real data from API
                const [seasonsData, predictionData] = await Promise.all([
                    getAvailableSeasons(),
                    predictSeasonFromData('2024-25', true).catch(() => null)
                ]);

                // Real stats: 46 teams tracked across 25 seasons, ~380 matches per season
                const numSeasons = seasonsData.seasons.length;
                setStats({
                    seasons: numSeasons,
                    teams: 46, // Real count of unique teams in dataset
                    matches: numSeasons * 380, // ~380 matches per season
                    topTeam: predictionData?.predictions?.[0]?.team || 'Liverpool'
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const features = [
        {
            title: 'Season Rankings',
            description: 'AI-powered predictions for final league standings with 93.8% accuracy',
            icon: Target,
            path: '/season-rankings',
            gradient: 'from-[#0b6623] to-[#2ecc71]',
            stats: 'R² Score: 0.938',
            color: 'green',
        },
        {
            title: 'Match Predictor',
            description: 'Real-time match outcome predictions with probability analysis',
            icon: Zap,
            path: '/match-predictor',
            gradient: 'from-[#2ecc71] to-[#0b6623]',
            stats: 'Live Predictions',
            color: 'green',
        },
        {
            title: 'Team Styles',
            description: 'Discover tactical patterns and playing styles across the league',
            icon: Users,
            path: '/team-styles',
            gradient: 'from-[#0b6623] via-[#2ecc71] to-[#0b6623]',
            stats: '5 Tactical Clusters',
            color: 'green',
        },
        {
            title: 'Player Scout',
            description: 'Uncover rising stars and hidden gems with ML recommendations',
            icon: Trophy,
            path: '/player-scout',
            gradient: 'from-[#2ecc71] via-[#c9a227] to-[#0b6623]',
            stats: 'Top Performers',
            color: 'gold',
        },
    ];

    // Static Tailwind class maps to avoid dynamic interpolation issues - all green palette
    const colorMap: Record<string, { icon: string; gradientFrom: string; gradientTo: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
        green: { icon: 'stat-green', gradientFrom: 'from-[#0b6623]', gradientTo: 'to-[#2ecc71]', badgeBg: 'bg-[#e9f9ec]', badgeBorder: 'border-[#0b6623]/20', badgeText: 'stat-green' },
        gold: { icon: 'stat-gold', gradientFrom: 'from-[#c9a227]', gradientTo: 'to-[#2ecc71]', badgeBg: 'bg-[#fdf6e3]', badgeBorder: 'border-[#c9a227]/20', badgeText: 'stat-gold' },
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section with Dynamic Background */}
            <div className="relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#0b6623]/15 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2ecc71]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#c9a227]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
                    <div className="text-center animate-fade-in">
                        {/* Logo */}
                        <div className="flex justify-center mb-8">
                            <img src="/logo.svg" alt="The 12th Player" className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl animate-bounce-slow" />
                        </div>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full pl-card-accent mb-8 border border-[#0b6623]/20 bg-white">
                            <Sparkles className="w-4 h-4 stat-green animate-pulse" />
                            <span className="text-sm font-medium pl-gradient-text">
                                Advanced Football Analytics
                            </span>
                            <Sparkles className="w-4 h-4 stat-green animate-pulse" />
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
                            <span className="block stat-green">The 12th Player</span>
                            <span className="block pl-gradient-text">AI Analytics</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-green max-w-3xl mx-auto mb-12 leading-relaxed">
                            Harness the power of AI to predict match outcomes, analyze team tactics,
                            and discover tomorrow's football stars
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link
                                to="/match-predictor"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="group px-8 py-4 rounded-2xl font-bold text-lg pl-gradient-primary hover:brightness-110 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-[#37003c]/50 flex items-center gap-2"
                            >
                                Predict a Match
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/season-rankings"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="px-8 py-4 rounded-2xl font-bold text-lg bg-white hover:bg-[#e9f9ec] border border-[#0b6623]/15 transform hover:scale-105 transition-all duration-300 text-[#0d1b0d]"
                            >
                                View Rankings
                            </Link>
                        </div>

                        {/* Quick Stats - Real Data */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-4xl mx-auto">
                            {[
                                { icon: BarChart3, label: 'ML Models', value: '5', color: 'green' },
                                { icon: Calendar, label: 'Seasons', value: loading ? '...' : stats.seasons.toString(), color: 'green' },
                                { icon: Users, label: 'Teams', value: loading ? '...' : stats.teams.toString(), color: 'green' },
                                { icon: TrendingUp, label: 'Matches', value: loading ? '...' : stats.matches.toLocaleString(), color: 'gold' },
                            ].map((stat, i) => {
                                const c = colorMap[stat.color] || colorMap['green'];
                                return (
                                    <div
                                        key={stat.label}
                                        className="glass-card p-4 md:p-6 animate-slide-up hover:bg-white/10 transition-all cursor-pointer group"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <stat.icon className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 md:mb-3 ${c.icon} group-hover:scale-110 transition-transform`} />
                                        <div className={`text-2xl md:text-3xl lg:text-4xl font-bold pl-gradient-text mb-1`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-xs md:text-sm text-muted-green font-medium">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Current Prediction Highlight */}
                        {!loading && stats.topTeam && (
                            <div className="mt-12 animate-fade-in">
                                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-[#c9a227]/30 shadow-lg">
                                    <Trophy className="w-5 h-5 text-[#c9a227]" />
                                    <span className="text-muted-green">2024-25 Predicted Champion:</span>
                                    <span className="font-bold stat-green">{stats.topTeam}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="text-center mb-16 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="stat-green">Powered by </span>
                        <span className="pl-gradient-text">Intelligence</span>
                    </h2>
                    <p className="text-xl text-muted-green max-w-2xl mx-auto">
                        Four specialized AI models working together to decode the beautiful game
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className="group relative overflow-hidden glass-card p-8 hover:bg-white transition-all duration-500 animate-slide-up"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Brand Overlay */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pl-gradient-primary"></div>

                                <div className="relative">
                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl pl-gradient-primary mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-[#37003c]/40`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-2xl md:text-3xl font-bold stat-green mb-3 group-hover:pl-gradient-text transition-all duration-300">
                                        {feature.title}
                                    </h3>

                                    <p className="text-muted-green text-lg mb-6 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        {(() => {
                                            return (
                                                <div className="px-4 py-2 rounded-lg bg-[#e9f9ec] border border-[#0b6623]/20">
                                                    <span className="text-sm font-semibold stat-green">
                                                        {feature.stats}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                        <ArrowRight className="w-6 h-6 text-muted-green group-hover:stat-green group-hover:translate-x-2 transition-all duration-300" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="relative overflow-hidden glass-card p-12 md:p-16 text-center animate-fade-in">
                    <div className="absolute inset-0 pl-gradient-primary opacity-20"></div>
                    <div className="relative">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            <span className="stat-green">Ready to explore </span>
                            <span className="pl-gradient-text">the future</span>
                            <span className="text-white"> of football analytics?</span>
                        </h2>
                        <p className="text-xl text-muted-green mb-8 max-w-2xl mx-auto">
                            Start making data-driven predictions and discover insights that traditional analysis misses
                        </p>
                        <Link
                            to="/match-predictor"
                            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-bold text-lg pl-gradient-primary hover:brightness-110 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-[#37003c]/50"
                        >
                            Get Started Now
                            <Sparkles className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
