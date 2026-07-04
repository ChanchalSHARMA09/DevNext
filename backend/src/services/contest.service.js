// src/services/contest.service.js
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { contestGeneratorPrompt } from "../prompts/contest.prompt.js";

const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4, // Slight boost in creativity for unique competitive problems
});

const prompt = PromptTemplate.fromTemplate(contestGeneratorPrompt);

export const generateContestService = async (topic, language) => {
    try {
        const chain = prompt.pipe(llm);
        
        const response = await chain.invoke({
            topic: topic,
            language: language || "JavaScript"
        });

        let cleanJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Groq Contest Generation Failed:", error);
        throw new Error("Failed to generate competitive contest arena.");
    }
};