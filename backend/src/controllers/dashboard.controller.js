// src/controllers/dashboard.controller.js
import { Analysis } from '../models/analysis.model.js'; 

// Helper function to calculate metrics for a specific array of submissions
const calculateLanguageMetrics = (records) => { 
    const totalSubmissions = records.length; 

    // 1. All-Time Average
    const totalScore = records.reduce((sum, r) => sum + r.aiFeedback.score, 0); 
    const allTimeAverage = Math.round(totalScore / totalSubmissions); 

    // 2. Rolling Window (Last 10 submissions for THIS language)
    const recentWindow = records.slice(0, 10); 
    const recentScoreSum = recentWindow.reduce((sum, r) => sum + r.aiFeedback.score, 0); 
    const currentSkillScore = Math.round(recentScoreSum / recentWindow.length); 

    // 3. Trend Trajectory (Comparing newest 5 vs previous 5 in THIS language)
    let trend = "STABLE ➖"; 
    if (records.length >= 6) { 
        const newestFiveAvg = records.slice(0, 5).reduce((acc, r) => acc + r.aiFeedback.score, 0) / 5; 
        const previousFiveAvg = records.slice(5, 10).reduce((acc, r) => acc + r.aiFeedback.score, 0) / Math.min(records.slice(5, 10).length, 5); 
        
        if (newestFiveAvg > previousFiveAvg + 5) trend = "IMPROVING 📈"; 
        else if (newestFiveAvg < previousFiveAvg - 5) trend = "DECLINING 📉"; 
    } 

    // 4. Unique Skill Gaps for THIS language
    const uniqueGaps = new Set(); 
    recentWindow.forEach(r => { 
        if (r.aiFeedback?.skillGapDetected) { 
            uniqueGaps.add(r.aiFeedback.skillGapDetected); 
        } 
    }); 

    return { 
        totalSubmissions, 
        currentSkillScore, 
        allTimeAverage, 
        trend, 
        activeSkillGaps: Array.from(uniqueGaps) 
    }; 
}; 

export const getDashboardMetrics = async (req, res) => { 
    try { 
        // 🔥 FIX: Extract the actual user's ID from the authenticated request object!
        // Note: Depending on your auth middleware setup, this might be req.user._id
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Access Denied. No valid authentication token provided." 
            });
        }

        const userId = req.user.id || req.user._id;
        
        // Fetch all history sorted from newest to oldest for THIS user only
        const history = await Analysis.find({ userId }).sort({ createdAt: -1 }); 

        if (history.length === 0) { 
            return res.status(200).json({ 
                success: true, 
                data: { 
                    overallTotalSubmissions: 0, 
                    languages: {}, 
                    recentHistory: [] 
                } 
            }); 
        } 

        // Group submissions by language (normalized to lowercase)
        const groupedByLanguage = {}; 
        history.forEach(record => {
            const lang = (record.language || 'unknown').toLowerCase(); 
            if (!groupedByLanguage[lang]) { 
                groupedByLanguage[lang] = []; 
            } 
            groupedByLanguage[lang].push(record); 
        }); 

        // Calculate independent metrics for each language group
        const languageStats = {}; 
        for (const [lang, records] of Object.entries(groupedByLanguage)) { 
            languageStats[lang] = calculateLanguageMetrics(records); 
        } 

        return res.status(200).json({ 
            success: true, 
            data: { 
                overallTotalSubmissions: history.length,
                languages: languageStats,          // <-- Independent breakdown per language![cite: 3]
                recentHistory: history.slice(0, 5) // <-- Last 5 overall evaluations across all languages[cite: 3]
            } 
        }); 
    } catch (error) { 
        console.error("Dashboard Controller Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard metrics." }); 
    }
};