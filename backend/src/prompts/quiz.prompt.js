export const quizGeneratorPrompt = `
You are an expert Technical Interviewer and Programming Mentor.
Generate a targeted 3-question multiple-choice quiz to help a developer master the following concept in {language}:

Topic to test: "{topic}"

Return your response ONLY as a valid, raw JSON object matching this exact structure:
{{
  "topic": "{topic}",
  "language": "{language}",
  "questions": [
    {{
      "id": 1,
      "question": "<clear, practical conceptual or code-based question>",
      "options": [
        "<Option A>",
        "<Option B>",
        "<Option C>",
        "<Option D>"
      ],
      "correctAnswer": "<Exact string matching one of the 4 options above>",
      "explanation": "<Concise 1-2 sentence explanation of why this answer is correct>"
    }},
    {{
      "id": 2,
      "question": "<second question...>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching option>",
      "explanation": "<Explanation>"
    }},
    {{
      "id": 3,
      "question": "<third question...>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching option>",
      "explanation": "<Explanation>"
    }}
  ]
}}
`;