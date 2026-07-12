import { analyzeUserCode } from '../services/analysis.service.js';
import { Analysis } from '../models/analysis.model.js'; // <-- 1. Import your Mongoose Model

export const handleCodeAnalysis = async (req, res) => {
    try {
        const { code, language, userId } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: "Missing 'code' or 'language' in the request body."
            });
        }

        const aiResult = await analyzeUserCode(code, language);

        const savedRecord = await Analysis.create({
            userId: userId || "anonymous_developer",
            language: language,
            userCode: code,
            aiFeedback: aiResult
        });
        
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