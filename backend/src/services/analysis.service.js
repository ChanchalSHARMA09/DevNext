import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

// Initialize Groq running Llama 3.3 70B
const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
});

// Create the LangChain prompt template
const analysisTemplate = `
You are an expert Senior Software Engineer and AI Mentor. 
Your goal is to review the following {language} code snippet and help the developer grow.

Evaluate the code for:
1. Bugs or syntax issues
2. Code smells or bad practices
3. The "proper" modern idiom (e.g., Pythonic PEP 8 or ES6+ JS)

Return your response ONLY as a valid, raw JSON object with this exact structure:
{{
  "score": <number from 1 to 100 on code quality>,
  "summary": "<1 sentence overall assessment>",
  "bugsFound": ["<bug 1>", "<bug 2>"],
  "betterPattern": "<code snippet showing the optimized way to write it>",
  "skillGapDetected": "<what specific concept does this developer need to study? e.g., 'React Hook Dependencies' or 'Python List Comprehensions'>"
}}

Code to analyze:
\`\`\`{language}
{code}
\`\`\`
`;

const prompt = PromptTemplate.fromTemplate(analysisTemplate);

export const analyzeUserCode = async (code, language) => {
    try {
        // Pipeline: Pass variables into Prompt -> Send to LLM
        const chain = prompt.pipe(llm);
        
        const response = await chain.invoke({
            code: code,
            language: language
        });

        // Clean up any potential markdown backticks that Llama might wrap around the JSON
        let cleanJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Parse the raw string into a real JavaScript object
        return JSON.parse(cleanJson);
        
    } catch (error) {
        console.error("Groq Analysis Error:", error);
        throw new Error("Failed to analyze code snippet.");
    }
};