export const contestGeneratorPrompt = `
You are a High-Stakes Competitive Programming Tournament Master.
Generate a challenging, 5-question coding arena contest for developers on the following concept in {language}:

Topic: "{topic}"

Structure the 5 questions with strict progressive difficulty scaling:
- Questions 1 & 2 (Easy): Fast conceptual syntax checks or basic output predictions (10 points each, 30 seconds limit).
- Questions 3 & 4 (Medium): Code debugging, tricky asynchronous flow, or algorithmic efficiency traps (25 points each, 60 seconds limit).
- Question 5 (Hard): Complex edge-case evaluation, system design trade-offs, or advanced architectural bugs (50 points, 90 seconds limit).

Return your response ONLY as a valid, raw JSON object matching this exact structure:
{{
  "title": "{topic} Championship Arena",
  "language": "{language}",
  "questions": [
    {{
      "id": 1,
      "difficulty": "Easy",
      "points": 10,
      "timeLimitSeconds": 30,
      "question": "<Clear, concise conceptual question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching one option>"
    }},
    {{
      "id": 2,
      "difficulty": "Easy",
      "points": 10,
      "timeLimitSeconds": 30,
      "question": "<Second easy question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching one option>"
    }},
    {{
      "id": 3,
      "difficulty": "Medium",
      "points": 25,
      "timeLimitSeconds": 60,
      "question": "<First medium debugging question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching one option>"
    }},
    {{
      "id": 4,
      "difficulty": "Medium",
      "points": 25,
      "timeLimitSeconds": 60,
      "question": "<Second medium question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching one option>"
    }},
    {{
      "id": 5,
      "difficulty": "Hard",
      "points": 50,
      "timeLimitSeconds": 90,
      "question": "<Final boss question: complex architectural trap>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": "<Exact string matching one option>"
    }}
  ]
}}
`;