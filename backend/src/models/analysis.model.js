// src/models/analysis.model.js
import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
    // In the future, we will link this to a User ID. For now, we will track anonymously
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
    // This sub-object maps perfectly to the structured JSON our Llama prompt returns!
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

// Create and export the model
export const Analysis = mongoose.model('Analysis', AnalysisSchema);