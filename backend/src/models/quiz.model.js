import mongoose from 'mongoose';

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

const QuizAttemptSchema = new mongoose.Schema({
    userId: { type: String, default: "anonymous_developer" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
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