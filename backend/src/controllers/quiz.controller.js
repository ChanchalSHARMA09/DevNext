// src/controllers/quiz.controller.js
import { generateQuizService } from '../services/quiz.service.js';
import { Analysis } from '../models/analysis.model.js';
import { Quiz, QuizAttempt } from '../models/quiz.model.js';

// 1. GENERATE QUIZ
export const handleGenerateQuiz = async (req, res) => {
    try {
        let { topic, language, userId } = req.body;
        const targetUser = userId || "anonymous_developer";

        // Smart Fallback: Auto-detect weakness if no topic provided
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

        // Call Groq AI Service
        const quizData = await generateQuizService(topic, language);

        // SAVE TO MONGODB so we can grade against it later!
        const savedQuiz = await Quiz.create({
            userId: targetUser,
            topic: quizData.topic,
            language: quizData.language || "General",
            questions: quizData.questions
        });

        return res.status(201).json({
            success: true,
            message: `Personalized quiz generated and stored for: ${topic}`,
            data: savedQuiz // Includes the MongoDB _id needed for submission!
        });

    } catch (error) {
        console.error("Quiz Generation Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error during quiz generation." });
    }
};

// 2. SUBMIT AND GRADE QUIZ (Secure Backend Grading Engine)
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

        // Fetch the official quiz from MongoDB
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found in database." });
        }

        let correctCount = 0;
        const gradedAnswers = [];

        // Grade each question
        quiz.questions.forEach((q) => {
            // Find the user's submitted answer for this question ID
            const userSelection = answers.find(a => a.questionId === q.id);
            const selectedOption = userSelection ? userSelection.selectedOption : null;
            
            // Check if exact string matches
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

        // Calculate final score percentage
        const totalQuestions = quiz.questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= 66; // Need at least 2 out of 3 right to pass

        // Save the graded attempt to DB
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