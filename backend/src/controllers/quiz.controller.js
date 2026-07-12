import { generateQuizService } from '../services/quiz.service.js';
import { Analysis } from '../models/analysis.model.js';
import { Quiz, QuizAttempt } from '../models/quiz.model.js';

export const handleGenerateQuiz = async (req, res) => {
    try {
        let { topic, language, userId } = req.body;
        const targetUser = userId || "anonymous_developer";

        if (!topic) {
            const latestSubmission = await Analysis.findOne({ userId: targetUser }).sort({ createdAt: -1 });
            if (!latestSubmission || !latestSubmission.aiFeedback?.skillGapDetected) {
                return res.status(400).json({
                    success: false,
                    message: "No explicit topic provided, and no past analysis history found."
                });
            }
            topic = latestSubmission.aiFeedback.skillGapDetected;
            language = language || latestSubmission.language;
        }

        const quizData = await generateQuizService(topic, language);

        const savedQuiz = await Quiz.create({
            userId: targetUser,
            topic: quizData.topic,
            language: quizData.language || "General",
            questions: quizData.questions
        });

        return res.status(201).json({
            success: true,
            message: `Personalized quiz generated and stored for: ${topic}`,
            data: savedQuiz
        });

    } catch (error) {
        console.error("Quiz Generation Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error during quiz generation." });
    }
};

export const handleSubmitQuiz = async (req, res) => {
    try {
        const { quizId, answers, userId } = req.body;
        const targetUser = userId || "anonymous_developer";

        if (!quizId || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 'quizId' and an array of 'answers'."
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found in database." });
        }

        let correctCount = 0;
        const gradedAnswers = [];

        quiz.questions.forEach((q) => {
            const userSelection = answers.find(a => a.questionId === q.id);
            const selectedOption = userSelection ? userSelection.selectedOption : null;
            
            const isCorrect = selectedOption === q.correctAnswer;
            if (isCorrect) correctCount++;

            gradedAnswers.push({
                questionId: q.id,
                selectedOption: selectedOption || "No Answer",
                isCorrect: isCorrect,
                correctAnswer: q.correctAnswer, // Send back so UI can show what they missed
                explanation: q.explanation
            });
        });

        const totalQuestions = quiz.questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= 66; // Need at least 2 out of 3 right to pass

        const savedAttempt = await QuizAttempt.create({
            userId: targetUser,
            quizId: quiz._id,
            topic: quiz.topic,
            score,
            passed,
            userAnswers: gradedAnswers
        });

        return res.status(200).json({
            success: true,
            message: passed ? "Quiz passed! Great job!" : "Quiz completed. Keep practicing!",
            data: {
                score: `${score}%`,
                passed,
                correctCount: `${correctCount}/${totalQuestions}`,
                detailedResults: gradedAnswers,
                attemptId: savedAttempt._id
            }
        });

    } catch (error) {
        console.error("Quiz Grading Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error during grading." });
    }
};