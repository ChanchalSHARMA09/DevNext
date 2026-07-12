import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Swords, 
    Users, 
    PlusCircle, 
    LogOut, 
    Sparkles, 
    AlertCircle, 
    BrainCircuit, 
    BarChart3, 
    Activity, 
    TrendingUp, 
    Layers, 
    Calendar,
    Code2,
    BookOpen
} from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [difficulty, setDifficulty] = useState('Medium');
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard');
                if (response.data?.success) {
                    setMetrics(response.data.data);
                }
            } catch (err) {
                console.error("Could not fetch analytical progress map:", err);
                setError('Analytics platform engine timed out sync protocols.');
            } finally {
                setLoadingMetrics(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleCreateRoom = async () => {
        setIsCreating(true);
        setError('');
        try {
            const response = await api.post('/contest/create', {
                title: `${user.username}'s Battle Arena`,
                difficulty: difficulty,
                language: language
            });
            
            const newRoomId = response.data.data?.roomId || 
                            response.data.roomId || 
                            response.data.contest?._id || 
                            response.data._id;

            if (!newRoomId) {
                throw new Error("Room created, but ID was missing in response.");
            }

            navigate(`/lobby/${newRoomId}`);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create room.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        navigate(`/lobby/${joinCode.trim()}`);
    };

    const handleLaunchAdaptiveQuiz = async () => {
        setIsGeneratingQuiz(true);
        setError('');
    
        try {
            const response = await api.post('/quiz/generate', {
                topic: '',
                language: ''
            });
    
            if (response.data?.success) {
                navigate('/quiz', { state: { generatedQuiz: response.data.data } });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to craft adaptive challenge.');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const getScoreBadgeColor = (score) => {
        if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-100 space-y-12">
            {/* Top Navigation Bar */}
            <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                        <Swords className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-bold tracking-wider text-white">DEV<span className="text-indigo-500">NEXT</span></span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img 
                            src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`} 
                            alt={user?.username} 
                            className="h-10 w-10 rounded-full border border-indigo-500 bg-slate-800"
                        />
                        <div className="hidden sm:block">
                            <h3 className="text-sm font-bold text-white leading-none">{user?.username}</h3>
                            <span className="text-xs text-emerald-400 font-medium">● Online</span>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        title="Sign Out"
                        className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Main Action Grid */}
            <main className="mx-auto max-w-7xl space-y-12">
                {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Grid Modules: Deployment Options */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Card 1: Create Room */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-xl">
                        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
                        <div>
                            <div className="inline-flex rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20 mb-4">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Create Arena</h2>
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                Spin up a fresh AI contest room. Become the host, invite rivals, and start the trial.
                            </p>
                        </div>

                        <button
                            onClick={handleCreateRoom}
                            disabled={isCreating}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
                        >
                            <PlusCircle className="h-4 w-4" />
                            {isCreating ? 'Generating...' : 'Forge Arena'}
                        </button>
                    </div>

                    {/* Card 2: Join Room */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-xl">
                        <div>
                            <div className="inline-flex rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20 mb-4">
                                <Users className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Join Arena</h2>
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                Received a secret room code? Enter the ID below to jump directly into the waiting lobby.
                            </p>
                        </div>

                        <form onSubmit={handleJoinRoom} className="mt-6 space-y-3">
                            <input
                                type="text"
                                required
                                placeholder="Paste Room ID"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition"
                            />
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-xs font-semibold text-emerald-400 border border-slate-700 hover:bg-emerald-500/10 transition"
                            >
                                Enter Lobby →
                            </button>
                        </form>
                    </div>

                    {/* Card 3: AI Code Inspector */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-xl group hover:border-purple-500/20 transition-all duration-300">
                        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
                        <div>
                            <div className="inline-flex rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20 mb-4">
                                <BrainCircuit className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Code Inspector</h2>
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                Submit code segments to run structural analysis trace checks and detect gaps.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/analysis')}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-purple-400 border border-slate-700 hover:bg-purple-500/10 transition"
                        >
                            Launch Diagnostics
                        </button>
                    </div>

                    {/* Card 4: Dedicated Quiz Router Link Anchor */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between shadow-xl group hover:border-amber-500/20 transition-all duration-300">
                        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
                        <div>
                            <div className="inline-flex rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20 mb-4">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Adaptive AI Quiz</h2>
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                Dynamically generated tests automatically matching your Inspector skill gaps.
                            </p>
                        </div>

                        <button
                            onClick={handleLaunchAdaptiveQuiz}
                            disabled={isGeneratingQuiz}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-amber-400 border border-slate-700 hover:bg-amber-500/10 transition disabled:opacity-50"
                        >
                            {isGeneratingQuiz ? (
                                <><Activity className="h-4 w-4 animate-spin" /> Compiling Matrix...</>
                            ) : (
                                <>Take Weakness Quiz →</>
                            )}
                        </button>
                    </div>

                </div>

                {/* PERFORMANCE REPORT MODULE */}
                <section className="space-y-6 pt-6">
                    <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                        <BarChart3 className="h-5 w-5 text-indigo-400" />
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-wide">Performance Diagnostics Report</h3>
                            <p className="text-xs text-slate-500 font-mono">Aggregated processing telemetry from metrics engine</p>
                        </div>
                    </div>

                    {loadingMetrics ? (
                        <div className="flex py-12 justify-center items-center gap-3 text-sm text-slate-500 font-mono">
                            <Activity className="h-5 w-5 text-indigo-500 animate-spin" />
                            <span>Compiling execution metrics across environments...</span>
                        </div>
                    ) : !metrics || metrics.overallTotalSubmissions === 0 ? (
                        <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center text-xs font-mono text-slate-500">
                            <Layers className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                            <p>No telemetry pipelines created yet.</p>
                            <p className="text-indigo-400/70 mt-1 cursor-pointer hover:underline" onClick={() => navigate('/analysis')}>
                                Submit your first file to the AI Code Inspector to generate stats →
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* Language Stats Grid */}
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                {Object.entries(metrics.languages).map(([langName, data]) => (
                                    <div key={langName} className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-6 space-y-4 shadow-md relative group">
                                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Code2 className="h-4 w-4 text-indigo-400" />
                                                <h4 className="text-md font-bold text-white capitalize tracking-wide">{langName} Trace</h4>
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
                                                {data.totalSubmissions} checks
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center py-1">
                                            <div>
                                                <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-widest font-mono">Current Index</span>
                                                <span className="text-xl font-black text-white font-mono tracking-tight">{data.currentSkillScore}<span className="text-xs font-normal text-slate-500">/100</span></span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-widest font-mono">Historical Avg</span>
                                                <span className="text-xl font-black text-slate-300 font-mono tracking-tight">{data.allTimeAverage}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-widest font-mono">Trajectory</span>
                                                <span className="text-xs block font-bold mt-1.5 font-mono text-slate-200">{data.trend}</span>
                                            </div>
                                        </div>

                                        {data.activeSkillGaps && data.activeSkillGaps.length > 0 && (
                                            <div className="pt-3 border-t border-slate-900 space-y-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono block">Target Upskilling Matrices:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {data.activeSkillGaps.map((gap, i) => (
                                                        <span key={i} className="text-[11px] font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 px-2.5 py-0.5 rounded-md truncate max-w-full">
                                                            ⚠️ {gap}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Recent History Ledger */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Recent Structural Diagnostic Audits
                                </h4>

                                <div className="divide-y divide-slate-900">
                                    {metrics.recentHistory.map((audit) => (
                                        <div key={audit._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-900/10 px-2 rounded-xl">
                                            <div className="space-y-1 max-w-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold capitalize px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 font-mono text-slate-300">
                                                        {audit.language}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> {new Date(audit.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-300 line-clamp-1 italic leading-relaxed">
                                                    "{audit.aiFeedback?.summary || 'No overview provided.'}"
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className={`px-3 py-1 rounded-lg border text-sm font-black font-mono shadow-inner ${getScoreBadgeColor(audit.aiFeedback?.score)}`}>
                                                    {audit.aiFeedback?.score || 0} PTS
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}