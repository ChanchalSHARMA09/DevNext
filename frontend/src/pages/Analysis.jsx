import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Code2, 
    BrainCircuit, 
    Sparkles, 
    AlertTriangle, 
    CheckCircle2, 
    Zap, 
    Terminal,
    ArrowRight
} from 'lucide-react';

export default function Analysis() {
    const { user } = useAuth();
    const [code, setCode] = useState('// Paste your code here to inspect optimization potential...\n\nfunction calculateTotal(items) {\n    let total = 0;\n    for(let i=0; i<items.length; i++) {\n        total += items[i].price;\n    }\n    return total;\n}');
    const [language, setLanguage] = useState('javascript');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyzeCode = async () => {
        if (!code.trim() || isAnalyzing) return;

        setIsAnalyzing(true);
        setError(null);
        setFeedback(null);

        try {
            const response = await api.post('/analysis/analyze', {
                code,
                language,
                userId: user?.id || user?._id || null
            });

            if (response.data?.success) {
                setFeedback(response.data.data.aiFeedback);
            }
        } catch (err) {
            console.error("Analysis Request Failed:", err);
            setError(err.response?.data?.message || "Internal Engine Error running AI analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
        if (score >= 50) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
        return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' };
    };

    const scoreStyle = feedback ? getScoreColor(feedback.score) : null;

    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
            {/* Upper Action Bar */}
            <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/30 px-6 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                        <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-md font-bold tracking-wide text-white">AI Code Inspector</h2>
                        <p className="text-xs text-slate-400">Evaluate structural efficiency, bug patterns, and gaps</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 outline-none hover:border-slate-700 focus:border-indigo-500 transition cursor-pointer"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>

                    <button
                        onClick={handleAnalyzeCode}
                        disabled={isAnalyzing || !code.trim()}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                    >
                        <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        {isAnalyzing ? 'Analyzing Engine...' : 'Run Diagnostics'}
                    </button>
                </div>
            </header>

            {/* Split Screen Application Canvas */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* LEFT COLUMN: Input Workspace */}
                <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/10 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                        <Code2 className="h-4 w-4 text-indigo-400" />
                        <span>Source Code Input</span>
                    </div>

                    <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm relative group shadow-inner">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="h-full w-full bg-transparent text-slate-300 outline-none resize-none overflow-y-auto leading-relaxed whitespace-pre font-mono selection:bg-indigo-500/30"
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: AI Feedback Outputs Dashboard */}
                <div className="w-1/2 flex flex-col bg-slate-950 p-6 overflow-y-auto">
                    {isAnalyzing && (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 animate-pulse">
                            <BrainCircuit className="h-12 w-12 text-indigo-500 animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">Parsing execution semantics...</p>
                                <p className="text-xs text-slate-500 mt-1">Llama model mapping structural complexity indexes</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm flex gap-3 items-start">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    {!isAnalyzing && !error && !feedback && (
                        <div className="flex h-full flex-col items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
                            <Terminal className="h-8 w-8 text-slate-700 mb-3" />
                            <p>Awaiting Diagnostics payload submission.</p>
                            <p className="text-slate-600 mt-1">Press "Run Diagnostics" to check code stats.</p>
                        </div>
                    )}

                    {/* AI Feedback Presentational View */}
                    {feedback && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            
                            {/* Score Card Banner */}
                            <div className={`flex items-center justify-between rounded-xl border ${scoreStyle.border} ${scoreStyle.bg} p-5`}>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Structural Evaluation Score</h3>
                                    <p className="text-xs text-slate-300">Determined through algorithmic syntax checking benchmarks</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-4xl font-black font-mono tracking-tight ${scoreStyle.text}`}>
                                        {feedback.score}
                                    </span>
                                    <span className="text-xs text-slate-500 block font-bold uppercase tracking-widest mt-0.5">/ 100 PTS</span>
                                </div>
                            </div>

                            {/* Summary Field */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                    <Zap className="h-4 w-4" /> Comprehensive Executive Summary
                                </h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    {feedback.summary}
                                </p>
                            </div>

                            {/* Bugs Found List Grid */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Vulnerabilities & Logic Bugs Detected
                                </h4>
                                {feedback.bugsFound && feedback.bugsFound.length > 0 ? (
                                    <div className="space-y-2">
                                        {feedback.bugsFound.map((bug, idx) => (
                                            <div key={idx} className="flex gap-3 items-start text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                                                <span className="font-mono text-slate-500 font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                                                <p className="leading-relaxed">{bug}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        <span className="font-medium">Clean Compilation Trace: Zero execution blocking flaws found.</span>
                                    </div>
                                )}
                            </div>

                            {/* Better Design Optimization Code Block */}
                            {feedback.betterPattern && (
                                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4" /> Recommended Refined Pattern
                                    </h4>
                                    <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-indigo-300 border border-slate-900 leading-relaxed whitespace-pre">
                                        {feedback.betterPattern}
                                    </pre>
                                </div>
                            )}

                            {/* Skill Gap Matrix */}
                            <div className="rounded-xl border border-indigo-500/10 bg-indigo-600/5 p-5 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                    <ArrowRight className="h-4 w-4" /> Target Concept Upskilling Matrix
                                </h4>
                                <div className="text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-900/50">
                                    {feedback.skillGapDetected}
                                </div>
                            </div>

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}