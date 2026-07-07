// src/pages/Arena.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import api from '../services/api';
import { Trophy, Timer, Send, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function Arena() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [contest, setContest] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);
    
    // 🔥 New state to toggle between active quiz or final scorecard screen
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        // 🔥 CRITICAL REFRESH GUARD: Wait until Auth Context restores the user session!
        if (!user || (!user.id && !user._id)) return;

        const fetchArenaData = async () => {
            try {
                const response = await api.get(`/contest/room/${roomId}`);
                const contestData = response.data.data || response.data;
                
                if (contestData.status === 'waiting') {
                    navigate(`/lobby/${roomId}`);
                    return;
                }

                setContest(contestData);
                
                if (contestData.endTime) {
                    const msRemaining = new Date(contestData.endTime).getTime() - Date.now();
                    setTimeLeft(Math.max(0, Math.floor(msRemaining / 1000)));
                } else {
                    setTimeLeft((contestData.questions?.length || 5) * 120);
                }
                
                if (!socket.connected) socket.connect();

                // Signal active connection recovery using immutable user identity
                socket.emit('joinRoom', { 
                    roomId, 
                    userId: user.id || user._id, 
                    username: user.username, 
                    avatar: user.avatar 
                });

            } catch (err) {
                console.error("Failed to load arena data", err);
                navigate('/dashboard');
            }
        };

        fetchArenaData();

        socket.on('leaderboardUpdate', (fullPlayerList) => {
            setLeaderboard(fullPlayerList);
        });

        socket.on('contestEnded', ({ finalLeaderboard }) => {
            setFeedback({ message: '🚨 Contest time expired! Submissions locked.' });
            if (finalLeaderboard) setLeaderboard(finalLeaderboard);
            // 🔥 REDIRECT TRIGGER: Host stopped match or duration lapsed on server
            setShowResults(true);
        });

        return () => {
            socket.off('leaderboardUpdate');
            socket.off('contestEnded');
        };
    }, [roomId, user, navigate]);

    // Clock Decrementer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // 🔥 REDIRECT TRIGGER: Local countdown timer hit zero
                    setShowResults(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = contest?.questions?.[activeQuestionIndex];
    const isLastQuestion = activeQuestionIndex === (contest?.questions?.length || 0) - 1;

    const handleSubmitAnswer = async () => {
        if (!selectedOption || !currentQuestion) return;
        
        setIsSubmitting(true);
        setFeedback(null);
        
        try {
            const response = await api.post('/contest/submit', { 
                roomId, 
                questionId: currentQuestion.id,
                selectedOption,
                socketId: socket.id,
                username: user?.username || "Gladiator"
            });
            
            if (response.data.success) {
                setFeedback({
                    isCorrect: response.data.data.isCorrect,
                    pointsAwarded: response.data.data.pointsAwarded,
                    correctAnswer: response.data.data.correctAnswer
                });
            }
        } catch (err) {
            setFeedback({ 
                isCorrect: false, 
                message: err.response?.data?.message || 'Failed to process submission.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (!isLastQuestion) {
            setActiveQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setFeedback(null);
        } else {
            // 🔥 REDIRECT TRIGGER: User clicks finish on final question card
            setShowResults(true); 
        }
    };

    // Render global loading panel until user credentials and contest configurations load
    if (!user || !contest) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
                <p className="animate-pulse font-medium tracking-wide">Syncing arena session...</p>
            </div>
        );
    }

    // ==========================================
    // 📊 CONDITIONAL RETURN: FINAL SCORECARD SCREEN
    // ==========================================
    if (showResults) {
        const myPerformance = leaderboard.find(p => p.userId === (user?.id || user?._id));
        const finalScore = myPerformance?.score || 0;
        const rank = leaderboard.findIndex(p => p.userId === (user?.id || user?._id)) + 1;

        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 animate-in fade-in zoom-in duration-200">
                <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl shadow-2xl">
                    
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/10 text-amber-400 border border-indigo-500/20 mb-6">
                        <Trophy className="h-8 w-8 animate-bounce" />
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-white">Match Concluded!</h1>
                    <p className="text-sm font-mono text-indigo-400 uppercase tracking-wider mt-1">
                        {contest?.title || 'Arena Challenge'}
                    </p>

                    <hr className="border-slate-800 my-6" />

                    {/* Personal Stats HUD */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="rounded-xl bg-slate-950/50 border border-slate-900 p-4">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Your Score</span>
                            <span className="text-2xl font-mono font-bold text-emerald-400">{finalScore} <span className="text-xs text-slate-400">pts</span></span>
                        </div>
                        <div className="rounded-xl bg-slate-950/50 border border-slate-900 p-4">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Final Rank</span>
                            <span className="text-2xl font-mono font-bold text-indigo-400">
                                {rank > 0 ? `#${rank}` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Final Standing Podium List */}
                    <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 text-left mb-6 max-h-40 overflow-y-auto">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Final Standings</span>
                        <div className="space-y-2">
                            {leaderboard.slice(0, 5).map((player, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className={`font-medium ${player.userId === (user?.id || user?._id) ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                                        #{idx + 1} {player.username} {player.userId === (user?.id || user?._id) && '(You)'}
                                    </span>
                                    <span className="font-mono text-slate-400 font-bold">{player.score} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard Navigation Action Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🕹️ CORE UI: ACTIVE MATCH ARENA VIEW
    // ==========================================
    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
            {/* Top Match Bar */}
            <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/30 px-6 backdrop-blur-xl shrink-0">
                <div>
                    <h2 className="text-md font-bold tracking-wider text-white">
                        ARENA: <span className="text-indigo-400">{contest?.title || 'Knowledge Match'}</span>
                    </h2>
                </div>

                <div className={`flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-lg font-bold border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-emerald-400'}`}>
                    <Timer className="h-5 w-5" />
                    <span>{formatTime(timeLeft)}</span>
                </div>

                <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-xs font-semibold uppercase text-slate-400 hover:text-white transition"
                >
                    Leave Match
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Side: Real-Time Scoreboard */}
                <div className="w-1/4 flex flex-col border-r border-slate-800 bg-slate-900/10 p-6 overflow-y-auto">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 h-full flex flex-col">
                        <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3 shrink-0">
                            <Trophy className="h-5 w-5" />
                            <h3 className="font-bold text-white">Live Leaderboard</h3>
                        </div>

                        <div className="mt-4 space-y-2 flex-1 overflow-y-auto pr-2">
                            {leaderboard.map((player, idx) => (
                                <div 
                                    key={player.userId || idx}
                                    className={`flex items-center justify-between rounded-lg p-3 text-sm border ${player.userId === (user?.id || user?._id) ? 'bg-indigo-600/20 border-indigo-500/30 font-bold' : 'bg-slate-950/40 border-slate-800/50'} ${player.status === "Offline" ? 'opacity-40 line-through' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs text-slate-500 w-4">{idx + 1}.</span>
                                        <img src={player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} alt="" className="h-8 w-8 rounded-full bg-slate-800" />
                                        <span className="text-slate-200 truncate max-w-[100px]">{player.username}</span>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className="font-mono font-bold text-indigo-400">{player.score}</span>
                                        {player.status === "Offline" && <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider">DC</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: MCQ Interactive Area */}
                <div className="w-3/4 flex flex-col bg-slate-950 relative overflow-y-auto p-10">
                    {currentQuestion ? (
                        <div className="max-w-4xl mx-auto w-full space-y-8">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                                    Question {activeQuestionIndex + 1} of {contest?.questions?.length || 0}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                    {currentQuestion.points || 10} Points
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold text-white leading-tight">
                                {currentQuestion.question || currentQuestion.text}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                {(currentQuestion.options || []).map((option, idx) => {
                                    const isSelected = selectedOption === option;
                                    const isLocked = feedback !== null;
                                    const isActuallyCorrect = feedback?.correctAnswer === option;
                                    
                                    let buttonStyle = "border-slate-700 bg-slate-900/50 hover:border-indigo-500 hover:bg-slate-800 text-slate-300";
                                    
                                    if (isSelected && !isLocked) {
                                        buttonStyle = "border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]";
                                    } else if (isLocked) {
                                        if (isActuallyCorrect) {
                                            buttonStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                        } else if (isSelected && !isActuallyCorrect) {
                                            buttonStyle = "border-red-500 bg-red-500/10 text-red-400 opacity-50";
                                        } else {
                                            buttonStyle = "border-slate-800 bg-slate-900/30 text-slate-600 opacity-40 cursor-not-allowed";
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            disabled={isLocked || timeLeft <= 0}
                                            onClick={() => setSelectedOption(option)}
                                            className={`relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 ${buttonStyle}`}
                                        >
                                            <span className="text-lg font-semibold">{option}</span>
                                            {isLocked && isActuallyCorrect && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                                            {isLocked && isSelected && !isActuallyCorrect && <XCircle className="h-6 w-6 text-red-500" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-8 border-t border-slate-800/50 flex items-center justify-between mt-12">
                                <div className="flex-1">
                                    {feedback && (
                                        <div className={`flex items-center gap-3 text-lg font-bold ${feedback.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {feedback.isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                            {feedback.message || (feedback.isCorrect ? `Correct! +${feedback.pointsAwarded} Points` : 'Incorrect!')}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    {!feedback ? (
                                        <button
                                            onClick={handleSubmitAnswer}
                                            disabled={!selectedOption || isSubmitting || timeLeft <= 0}
                                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-4 w-4" />
                                            {isSubmitting ? 'Submitting...' : 'Lock Answer'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="flex items-center gap-2 rounded-xl bg-slate-100 px-8 py-3.5 text-sm font-bold text-slate-900 shadow-lg hover:bg-white transition"
                                        >
                                            {isLastQuestion ? 'Finish Match' : 'Next Question'}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-slate-500">
                            <p>Loading questions...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}