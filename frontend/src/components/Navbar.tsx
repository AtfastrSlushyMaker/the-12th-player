import { Link, useLocation } from 'react-router-dom';
import { Trophy, Zap, Users, Target, Menu, X, Sparkles, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { expertMode, toggleExpertMode } = useAppStore();

    const navItems = [
        { path: '/season-rankings', label: 'Rankings', icon: Target },
        { path: '/match-predictor', label: 'Predictor', icon: Zap },
        { path: '/team-styles', label: 'Team Styles', icon: Users },
        { path: '/player-scout', label: 'Scout', icon: Trophy },
        { path: '/news-classifier', label: 'News', icon: Shield },
    ];

    return (
        <nav className="sticky top-0 z-50 glass-card mx-4 my-4 border border-[#0b6623]/15">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <img src="/logo.svg" alt="The 12th Player" className="w-full h-full drop-shadow-lg" />
                        </div>
                        <div className="hidden md:block">
                            <div className="text-lg font-black pl-gradient-text">
                                The 12th Player
                            </div>
                            <div className="text-xs text-muted-green font-medium -mt-1">
                                AI Football Analytics
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all duration-300 ${isActive
                                        ? 'text-[#0d1b0d] bg-[#e9f9ec] shadow-inner'
                                        : 'text-muted-green hover:text-[#0d1b0d] hover:bg-[#e9f9ec]'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0b6623] to-[#2ecc71] opacity-10 -z-10"></div>
                                    )}
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleExpertMode}
                            className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${expertMode
                                ? 'pl-gradient-primary text-white shadow-lg shadow-[#0b6623]/30'
                                : 'bg-[#e9f9ec] text-muted-green hover:bg-white border border-[#0b6623]/15'
                                }`}
                        >
                            {expertMode ? (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Expert Mode
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4" />
                                    Normal Mode
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2.5 rounded-xl hover:bg-[#e9f9ec] text-muted-green hover:text-[#0d1b0d] transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-6 pt-6 border-t border-white/10 space-y-2 animate-slide-up">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                                        ? 'pl-gradient-primary text-white'
                                        : 'text-muted-green hover:bg-[#e9f9ec] hover:text-[#0d1b0d]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <button
                            onClick={() => {
                                toggleExpertMode();
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${expertMode
                                ? 'pl-gradient-primary text-white'
                                : 'text-muted-green hover:bg-[#e9f9ec] hover:text-[#0d1b0d] border border-[#0b6623]/15'
                                }`}
                        >
                            {expertMode ? (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Expert Mode Active
                                </>
                            ) : (
                                <>
                                    <Users className="w-5 h-5" />
                                    Enable Expert Mode
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
