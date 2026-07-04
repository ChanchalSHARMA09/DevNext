// src/controllers/analysis.controller.js
import { analyzeUserCode } from '../services/analysis.service.js';
import { Analysis } from '../models/analysis.model.js'; // <-- 1. Import your Mongoose Model

export const handleCodeAnalysis = async (req, res) => {
    try {
        // We also accept an optional 'userId' if a logged-in user sends their ID later
        const { code, language, userId } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: "Missing 'code' or 'language' in the request body."
            });
        }

        // 2. Call the AI service to grade the code
        const aiResult = await analyzeUserCode(code, language);

        // 3. Save the submission and the AI review directly into MongoDB
        const savedRecord = await Analysis.create({
            userId: userId || "anonymous_developer",
            language: language,
            userCode: code,
            aiFeedback: aiResult
        });

        // 4. Send back a 201 Created status along with the newly saved database record
        return res.status(201).json({
            success: true,
            message: "Code analyzed and saved successfully!",
            data: savedRecord
        });
        
    } catch (error) {
        console.error("Controller Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error during analysis."
        });
    }
};