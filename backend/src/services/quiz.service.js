// src/services/quiz.service.js
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { quizGeneratorPrompt } from "../prompts/quiz.prompt.js";

const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3, // Slightly higher temperature for creative quiz questions
});

const prompt = PromptTemplate.fromTemplate(quizGeneratorPrompt);

export const generateQuizService = async (topic, language) => {
    try {
        const chain = prompt.pipe(llm);
        
        const response = await chain.invoke({
            topic: topic,
            language: language || "General Software Engineering"
        });

        let cleanJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Groq Quiz Generation Failed:", error);
        throw new Error("Failed to generate personalized quiz.");
    }
};