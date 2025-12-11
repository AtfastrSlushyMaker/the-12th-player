import { useState } from 'react';
import { getModelInfo, type ModelInfo } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useEffect } from 'react';
import { RefreshCcw, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import ExpertPanel from '@/components/ExpertPanel';
import axios from 'axios';

interface NewsCredibilityResponse {
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TIER_COLORS = {
    1: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', icon: 'text-green-600' },
    2: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', icon: 'text-blue-600' },
    3: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', icon: 'text-yellow-600' },
    4: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', icon: 'text-red-600' },
};

const TIER_ICONS = {
    1: CheckCircle,
    2: Shield,
    3: AlertCircle,
    4: AlertCircle,
};

const EXAMPLE_ARTICLES = [
    {
        title: 'Is there any way back for Salah and Liverpool?',
        text: 'After Mohamed Salah\'s explosive interview about his Liverpool future, BBC Sport takes a closer look at if there is a way back for him.',
        expectedTier: 1
    },
    {
        title: 'Manchester United leading race for Kane - multiple sources',
        text: 'Manchester United have moved to the front of the queue to sign Harry Kane from Bayern Munich. Sources have told us the Red Devils are in advanced negotiations with the striker, with personal terms close to agreement.',
        expectedTier: 2
    },
    {
        title: 'SHOCK! Chelsea in STUNNING £100m mega-deal!',
        text: 'EXCLUSIVE! Chelsea are set to pull off the signing of the summer! The Blues are in talks for a MASSIVE new superstar that will REVOLUTIONIZE the Premier League! Full exclusive story inside - this is HUGE!',
        expectedTier: 3
    },
    {
        title: 'Just heard from someone I know',
        text: 'Omg I just spoke to someone who knows someone at Arsenal and they said they are signing 3 new players this week!! Trust me bro this is happening!!! This is 100% legit inside information!!',
        expectedTier: 4
    }
];

export default function NewsClassifier() {
    const { expertMode } = useAppStore();
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
    const [infoLoading, setInfoLoading] = useState(false);
    const [result, setResult] = useState<NewsCredibilityResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (expertMode) {
            setInfoLoading(true);
            getModelInfo('bo5' as any)
                .then(setModelInfo)
                .catch(() => { })
                .finally(() => setInfoLoading(false));
        }
    }, [expertMode]);

    const classifyNews = async () => {
        if (!title.trim() || !text.trim()) {
            setError('Please enter both title and article text');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/v1/classify-news`,
                {},
                {
                    params: {
                        title: title,
                        text: text,
                    },
                }
            );
            setResult(response.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e?.message || 'Failed to classify article');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl pl-gradient-primary mb-6 shadow-2xl shadow-[#0b6623]/30">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 pl-gradient-text">News Credibility</h1>
                <p className="text-xl text-muted-green max-w-2xl mx-auto">
                    Verify Premier League news source credibility with Naive Bayes text classification
                </p>
            </div>

            {/* Example Articles */}
            <div className="glass-card p-6 mb-6 animate-slide-up">
                <h3 className="text-sm font-bold text-muted-green uppercase tracking-wide mb-3">Try Example Articles</h3>
                <div className="grid md:grid-cols-4 gap-3">
                    {EXAMPLE_ARTICLES.map((article, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setTitle(article.title); setText(article.text); }}
                            className="p-3 rounded-xl bg-[#e9f9ec] hover:bg-white border border-[#0b6623]/20 text-left transition-all group"
                        >
                            <div className="text-xs font-semibold stat-green mb-1">Example {idx + 1}</div>
                            <div className="text-xs text-muted-green line-clamp-2">{article.title}</div>
                            <div className="text-[10px] text-muted-green mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                Expected: Tier {article.expectedTier}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tier Reference Guide */}
            <div className="glass-card p-6 mb-6 animate-slide-up">
                <h3 className="text-sm font-bold text-muted-green uppercase tracking-wide mb-4">Tier Characteristics</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border-2 ${TIER_COLORS[1].bg} ${TIER_COLORS[1].border}`}>
                        <h4 className={`font-bold ${TIER_COLORS[1].text} mb-2`}>Tier 1: Official</h4>
                        <ul className="text-xs text-muted-green space-y-1">
                            <li>✓ Club announcements</li>
                            <li>✓ Verified statements</li>
                            <li>✓ No exclamation marks</li>
                            <li>✓ Professional tone</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl border-2 ${TIER_COLORS[2].bg} ${TIER_COLORS[2].border}`}>
                        <h4 className={`font-bold ${TIER_COLORS[2].text} mb-2`}>Tier 2: Reliable</h4>
                        <ul className="text-xs text-muted-green space-y-1">
                            <li>✓ Named journalists</li>
                            <li>✓ Multiple sources</li>
                            <li>✓ Details and analysis</li>
                            <li>✓ Balanced reporting</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl border-2 ${TIER_COLORS[3].bg} ${TIER_COLORS[3].border}`}>
                        <h4 className={`font-bold ${TIER_COLORS[3].text} mb-2`}>Tier 3: Tabloid</h4>
                        <ul className="text-xs text-muted-green space-y-1">
                            <li>✗ EXCESSIVE caps</li>
                            <li>✗ SHOCK, BOMBSHELL!!!</li>
                            <li>✗ Sensational language</li>
                            <li>✗ Vague "sources say"</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl border-2 ${TIER_COLORS[4].bg} ${TIER_COLORS[4].border}`}>
                        <h4 className={`font-bold ${TIER_COLORS[4].text} mb-2`}>Tier 4: Unverified</h4>
                        <ul className="text-xs text-muted-green space-y-1">
                            <li>✗ No real sources</li>
                            <li>✗ "My cousin told me"</li>
                            <li>✗ 100% guaranteed claims</li>
                            <li>✗ Conspiracy theories</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div className="glass-card p-8 mb-8 animate-slide-up">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-green mb-2">
                            Article Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter article title..."
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#0b6623]/20 focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-green mb-2">
                            Article Text
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste article content here..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#0b6623]/20 focus:outline-none focus:ring-2 focus:ring-[#0b6623]/30"
                        />
                    </div>

                    <button
                        onClick={classifyNews}
                        disabled={loading}
                        className="pl-btn-primary flex items-center gap-2 w-full justify-center"
                    >
                        {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        {loading ? 'Classifying...' : 'Classify Article'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-100 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="glass-card p-8 mb-8 animate-fade-in">
                    {/* Tier Badge */}
                    <div className={`p-6 rounded-2xl mb-6 border-2 ${TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].bg} ${TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].border}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {(() => {
                                const TierIcon = TIER_ICONS[result.predicted_tier as 1 | 2 | 3 | 4];
                                return (
                                    <TierIcon
                                        className={`w-6 h-6 ${TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].icon}`}
                                    />
                                );
                            })()}
                            <h2 className={`text-2xl font-bold ${TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].text}`}>
                                {result.tier_label}
                            </h2>
                        </div>
                        <p className={TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].text}>
                            {result.credibility_description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`text-sm font-semibold ${TIER_COLORS[result.predicted_tier as 1 | 2 | 3 | 4].text}`}>
                                Confidence: {(result.confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wide text-muted-green font-semibold">Model Confidence</span>
                            <span className="text-sm font-bold stat-green">{(result.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#e9f9ec] overflow-hidden border border-[#0b6623]/10">
                            <div
                                className="h-full pl-gradient-primary rounded-full transition-all duration-500"
                                style={{ width: `${result.confidence * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Tier Probabilities */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { tier: 1, label: 'Official', prob: result.probabilities.tier_1 },
                            { tier: 2, label: 'Reliable', prob: result.probabilities.tier_2 },
                            { tier: 3, label: 'Tabloid', prob: result.probabilities.tier_3 },
                            { tier: 4, label: 'Unverified', prob: result.probabilities.tier_4 },
                        ].map((item) => (
                            <div key={item.tier} className={`p-4 rounded-lg border-2 ${TIER_COLORS[item.tier as 1 | 2 | 3 | 4].bg} ${TIER_COLORS[item.tier as 1 | 2 | 3 | 4].border}`}>
                                <p className={`text-xs uppercase tracking-wide font-semibold ${TIER_COLORS[item.tier as 1 | 2 | 3 | 4].text} mb-2`}>
                                    Tier {item.tier}
                                </p>
                                <p className={`text-2xl font-bold ${TIER_COLORS[item.tier as 1 | 2 | 3 | 4].text}`}>
                                    {(item.prob * 100).toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-green mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Title Display */}
                    <div className="mt-8 p-4 rounded-lg bg-[#f0fff0] border border-[#0b6623]/10">
                        <p className="text-xs uppercase tracking-wide text-muted-green font-semibold mb-1">Classified Article</p>
                        <p className="text-sm font-semibold text-gray-800">{result.title}</p>
                    </div>
                </div>
            )}

            <ExpertPanel title="News Classifier Model Details" info={modelInfo} loading={expertMode && infoLoading}>
                <div className="text-xs text-muted-green leading-relaxed space-y-2">
                    <p>
                        <strong>Algorithm:</strong> Multinomial Naive Bayes with TF-IDF vectorization (unigrams + bigrams)
                    </p>
                    <p>
                        <strong>Training Data:</strong> 278 Premier League news articles from 47 sources
                    </p>
                    <p>
                        <strong>Test Accuracy:</strong> 64% overall. Best on Tier 3 (Tabloids: 72%), worst on Tier 4 (Social media: 43%)
                    </p>
                    <p>
                        <strong>Key Insight:</strong> Model excels at detecting sensationalist language in tabloids but struggles
                        with writing style overlap between official sources and social media.
                    </p>
                </div>
            </ExpertPanel>
        </div>
    );
}
