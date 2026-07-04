// src/models/quiz.model.js
import mongoose from 'mongoose';

// Blueprint for saving generated quizzes
const QuizSchema = new mongoose.Schema({
    userId: { type: String, default: "anonymous_developer" },
    topic: { type: String, required: true },
    language: { type: String, required: true },
    questions: [{
        id: { type: Number, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String }
    }],
    createdAt: { type: Date, default: Date.now }
});

// Blueprint for saving completed quiz attempts & grades
const QuizAttemptSchema = new mongoose.Schema({
    userId: { type: String, default: "anonymous_developer" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true }, // Percentage out of 100
    passed: { type: Boolean, required: true },
    userAnswers: [{
        questionId: { type: Number },
        selectedOption: { type: String },
        isCorrect: { type: Boolean }
    }],
    createdAt: { type: Date, default: Date.now }
});

export const Quiz = mongoose.model('Quiz', QuizSchema);
export const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);