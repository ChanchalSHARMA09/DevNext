// src/controllers/dashboard.controller.js
import { Analysis } from '../models/analysis.model.js';

export const getDashboardMetrics = async (req, res) => {
    try {
        const userId = "anonymous_developer"; 
        const history = await Analysis.find({ userId }).sort({ createdAt: -1 });

        if (history.length === 0) {
            return res.status(200).json({
                success: true,
                data: { totalSubmissions: 0, averageScore: 0, skillGaps: [] }
            });
        }

        const totalSubmissions = history.length;
        const totalScore = history.reduce((sum, record) => sum + record.aiFeedback.score, 0);
        const averageScore = Math.round(totalScore / totalSubmissions);

        const uniqueGaps = new Set();
        history.forEach(record => {
            if (record.aiFeedback.skillGapDetected) {
                uniqueGaps.add(record.aiFeedback.skillGapDetected);
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                totalSubmissions,
                averageScore,
                skillGaps: Array.from(uniqueGaps),
                recentHistory: history.slice(0, 5)
            }
        });
    } catch (error) {
        console.error("Dashboard Controller Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard metrics." });
    }
};