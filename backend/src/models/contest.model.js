import mongoose from 'mongoose';

const ContestSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    language: { type: String, required: true },
    hostId: { type: String, default: "Host_Admin" },
    status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
    
    durationSeconds: { type: Number, default: 300 },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },

    questions: [{
        id: { type: Number, required: true },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        points: { type: Number, required: true },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
        timeLimitSeconds: { type: Number, default: 60 }
    }],
    createdAt: { type: Date, default: Date.now }
});

export const Contest = mongoose.model('Contest', ContestSchema);