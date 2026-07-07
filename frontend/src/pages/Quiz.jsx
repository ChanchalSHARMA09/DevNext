// src/pages/Quiz.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Award, CheckSquare, HelpCircle, ChevronLeft, AlertTriangle } from 'lucide-react';

export default function Quiz() {
    const navigate = useNavigate();
    const location = useLocation();

    // Grab the pre-loaded quiz data sent from the Dashboard!
    const [activeQuiz, setActiveQuiz] = useState(location.state?.generatedQuiz || null);
    
    const [quizAnswers, setQuizAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    // Security Gatekeeper: If someone tries to access /quiz directly via URL without generating one, kick them back.
    useEffect(() => {
        if (!activeQuiz) {
            navigate('/dashboard');
        }
    }, [activeQuiz, navigate]);

    const handleSelectOption = (questionId, optionText) => {
        if (quizResult) return; // Freeze selections once graded
        setQuizAnswers(prev => ({ ...prev, [questionId]: optionText }));
    };

    const handleSubmitQuizAnswers = async () => {
        const targetLength = activeQuiz?.questions?.length || 0;
        if (Object.keys(quizAnswers).length < targetLength) {
            alert("Please answer all diagnostic questions before submitting your sheet.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Reformat dictionary state to match backend array layer input schema
            const formattedAnswers = Object.entries(quizAnswers).map(([qId, option]) => ({
                questionId: Number(qId),
                selectedOption: option
            }));

            // Send answers to your grading controller
            const response = await api.post('/quiz/submit', {
                quizId: activeQuiz._id,
                answers: formattedAnswers
            });

            if (response.data?.success) {
                setQuizResult(response.data.data);
            }
        } catch (err) {
            console.error("Quiz submission process failed:", err);
            alert(err.response?.data?.message || "Failed to parse options matrix evaluation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent rendering errors if kicked back to dashboard
    if (!activeQuiz) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
                
                {/* Header block */}
                <header className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition"
                    >
                        <ChevronLeft className="h-4 w-4" /> Return to Arena Dashboard
                    </button>
                    
                    <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-950/40 px-3 py-1 rounded-md border border-indigo-900/40 uppercase font-bold">
                        Adaptive Mode Active
                    </span>
                </header>

                {/* State A: Active Questionnaire Form */}
                {!quizResult && (
                    <div className="space-y-8">
                        <div>
                            <span className="text-[10px] font-mono uppercase font-bold text-amber-500 tracking-widest">Weakness Vector Targeted:</span>
                            <h2 className="text-2xl font-black text-white capitalize tracking-wide mt-1">{activeQuiz.topic}</h2>
                            <p className="text-xs font-mono text-slate-500 mt-1">Environment Scope: {(activeQuiz.language || 'General').toUpperCase()}</p>
                        </div>

                        <div className="space-y-6">
                            {activeQuiz.questions.map((q, idx) => (
                                <div key={q.id} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                                            {q.question}
                                        </p>
                                    </div>

                                    {/* Options Matrix */}
                                    <div className="grid gap-2.5 pl-8">
                                        {q.options.map((option, oIdx) => {
                                            const isSelected = quizAnswers[q.id] === option;
                                            return (
                                                <button
                                                    key={oIdx}
                                                    type="button"
                                                    onClick={() => handleSelectOption(q.id, option)}
                                                    className={`w-full text-left rounded-xl p-3 text-xs font-medium border transition-all duration-150 ${
                                                        isSelected
                                                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold shadow-inner'
                                                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-900 flex justify-end">
                            <button
                                onClick={handleSubmitQuizAnswers}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/10"
                            >
                                <CheckSquare className="h-4 w-4" />
                                {isSubmitting ? 'Compiling Scores...' : 'Submit Evaluation'}
                            </button>
                        </div>
                    </div>
                )}

                {/* State B: Graded Evaluation Output */}
                {quizResult && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className={`p-6 rounded-2xl border text-center space-y-2 ${
                            quizResult.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                            <Award className="h-8 w-8 mx-auto mb-1" />
                            <h3 className="text-3xl font-black font-mono tracking-tighter">SCORE: {quizResult.score}</h3>
                            <p className="text-xs font-mono font-bold uppercase tracking-widest">
                                {quizResult.passed ? '🎉 Target Cleared — Vector Restored' : '⚠️ Telemetry Gap Remained Open'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">Verified {quizResult.correctCount} parameters correctly.</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-indigo-400" /> Diagnostic Review
                            </h4>

                            <div className="space-y-4">
                                {activeQuiz?.questions.map((q, idx) => {
                                    const grade = quizResult.detailedResults?.find(r => r.questionId === q.id);
                                    return (
                                        <div key={q.id} className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-3 text-xs">
                                            <p className="font-bold text-slate-200">
                                                <span className="text-slate-500 font-mono mr-1">{idx + 1}.</span> {q.question}
                                            </p>
                                            
                                            <div className="space-y-1 font-mono text-[11px] pl-4">
                                                <p><span className="text-slate-500">Your Selection:</span> <span className={grade?.isCorrect ? 'text-emerald-400' : 'text-rose-400 font-medium'}>{grade?.selectedOption}</span></p>
                                                {!grade?.isCorrect && (
                                                    <p><span className="text-emerald-400 font-bold">Target Solution:</span> <span className="text-slate-300">{grade?.correctAnswer}</span></p>
                                                )}
                                            </div>

                                            {grade?.explanation && (
                                                <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-900 text-[11px] text-slate-400 leading-relaxed italic">
                                                    <span className="text-indigo-400 font-mono font-bold not-italic block mb-0.5">AI Logic Breakdown:</span>
                                                    "{grade.explanation}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-900 flex justify-end">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs px-6 py-2.5 rounded-xl transition"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}