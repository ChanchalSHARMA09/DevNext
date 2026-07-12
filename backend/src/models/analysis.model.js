import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: "anonymous_developer"
    },
    language: {
        type: String,
        required: true,
        lowercase: true
    },
    userCode: {
        type: String,
        required: true
    },
    aiFeedback: {
        score: { type: Number, required: true },
        summary: { type: String, required: true },
        bugsFound: [{ type: String }],
        betterPattern: { type: String },
        skillGapDetected: { type: String, required: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Analysis = mongoose.model('Analysis', AnalysisSchema);