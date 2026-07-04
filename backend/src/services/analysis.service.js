import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { codeAnalysisPrompt } from "../prompts/analysis.prompt.js";

// Initialize the free Groq LLM running Llama 3.3 70B
const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
});

const prompt = PromptTemplate.fromTemplate(codeAnalysisPrompt);

export const analyzeUserCode = async (code, language) => {
    try {
        const chain = prompt.pipe(llm);
        const response = await chain.invoke({ code, language });
        
        let cleanJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Groq AI Analysis Failed:", error);
        throw new Error("Failed to analyze code snippet.");
    }
};