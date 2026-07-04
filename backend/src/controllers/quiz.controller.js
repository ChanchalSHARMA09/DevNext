// src/controllers/quiz.controller.js
import { generateQuizService } from '../services/quiz.service.js';
import { Analysis } from '../models/analysis.model.js';

export const handleGenerateQuiz = async (req, res) => {
    try {
        let { topic, language, userId } = req.body;

        // SMART FEATURE: If no topic is provided, fetch the user's last detected skill gap from MongoDB!
        if (!topic) {
            const targetUser = userId || "anonymous_developer";
            const latestSubmission = await Analysis.findOne({ userId: targetUser }).sort({ createdAt: -1 });

            if (!latestSubmission || !latestSubmission.aiFeedback?.skillGapDetected) {
                return res.status(400).json({
                    success: false,
                    message: "No explicit topic provided, and no past analysis history found to generate a personalized quiz."
                });
            }

            topic = latestSubmission.aiFeedback.skillGapDetected;
            language = language || latestSubmission.language;
        }

        // Generate the quiz using Groq
        const quizData = await generateQuizService(topic, language);

        return res.status(200).json({
            success: true,
            message: `Personalized quiz generated for topic: ${topic}`,
            data: quizData
        });

    } catch (error) {
        console.error("Quiz Controller Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error during quiz generation."
        });
    }
};