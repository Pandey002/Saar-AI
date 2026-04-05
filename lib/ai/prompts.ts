import type { LanguageMode } from "@/types";

function languageInstruction(language: LanguageMode) {
  return language === "hinglish"
    ? [
        "Write the explanation content in natural Hinglish using Roman script only.",
        "Keep the output structure exactly the same as English mode.",
        "Do not use Devanagari script.",
        "Do not do literal word-for-word translation.",
        "Keep technical terms in English, but explain them in student-friendly Hinglish.",
        "Headings may stay in English or be bilingual like 'Causes (Kaaran)' when helpful."
      ].join(" ")
    : "Write in clear academic English suitable for Indian students preparing for exams.";
}

function relatedTopicsInstruction(language: LanguageMode) {
  return language === "hinglish"
    ? `"relatedTopics" must contain exactly 3 natural Hinglish follow-up topics in Roman Hindi + English mix.`
    : `"relatedTopics" must contain exactly 3 closely related follow-up topics in clear English.`;
}

function webContextBlock(webContext?: string) {
  if (!webContext) {
    return "";
  }

  return `
Optional web context:
Use the verified context below only where it improves factual accuracy, recent data, or time-sensitive explanations.
Blend it naturally into the structured notes.
Do not mention URLs or say "according to the web".

${webContext}
`.trim();
}

const validationRules = `
CRITICAL VALIDATION:
Check the input text. If it is pure gibberish (e.g. random letters like 'enfjrvsvxjv234'), completely lacks meaning, or is just a few random characters, YOU MUST IGNORE ALL OTHER INSTRUCTIONS and return exactly this JSON:
{ "isRubbish": true }

If the input is valid but ambiguous (e.g., just the word "Network" or "AI") and could mean multiple distinct things, return exactly this JSON:
{ "isAmbiguous": true, "clarificationOptions": ["Option 1", "Option 2"] }
`;

export function summaryPrompt(sourceText: string, language: LanguageMode, webContext?: string) {
  return `
You are Saar AI, an AI study assistant for Indian students.
${languageInstruction(language)}
${validationRules}
${webContextBlock(webContext)}

Convert the source into a structured study summary.
Return valid JSON only in this shape:
{
  "title": "string",
  "introduction": "string",
  "concepts": [
    {
      "title": "string",
      "explanation": "string"
    }
  ],
  "coreConcepts": ["string"],
  "visualBlock": {
    "title": "string",
    "description": "string",
    "buttonLabel": "string"
  },
  "sections": [
    {
      "heading": "string",
      "paragraph": "string",
      "points": ["string"],
      "subsections": [
        {
          "heading": "string",
          "points": ["string"]
        }
      ]
    }
  ],
  "relatedTopics": ["string"]
}

Rules:
- The title must be clear and topic-based.
- The introduction must be 2 to 3 short lines maximum.
- "concepts" must contain 3 to 4 cards, each with a short title and explanation.
- "coreConcepts" must contain 3 to 5 crisp revision-note bullets.
- "visualBlock" should describe one helpful diagram or visual placeholder with a short title and description.
- Generate 3 to 5 main sections with clean headings such as causes, effects, importance, types, process, or prevention whenever relevant.
- Each section must contain either a short paragraph, bullet points, or both. Keep all writing concise and scannable.
- Use subsections only when the topic benefits from finer breakdown.
- ${relatedTopicsInstruction(language)}
- Prioritize bullets over long prose.
- Focus on exam-relevant ideas, formulas, definitions, and takeaways.
- Avoid markdown, prose outside JSON, and code fences.

Source:
${sourceText}
`.trim();
}

export function explanationPrompt(sourceText: string, language: LanguageMode, webContext?: string) {
  return `
You are Saar AI, an AI study assistant for Indian students.
${languageInstruction(language)}
${validationRules}
${webContextBlock(webContext)}

Explain the topic with first-principles clarity.
Return valid JSON only in this shape:
{
  "title": "string",
  "introduction": "string",
  "analogyCard": {
    "title": "string",
    "explanation": "string",
    "note": "string"
  },
  "formulaBlock": {
    "expression": "string",
    "caption": "string",
    "variables": [
      {
        "label": "string",
        "description": "string"
      }
    ]
  },
  "frameworkCards": [
    {
      "title": "string",
      "description": "string",
      "eyebrow": "string"
    }
  ],
  "coreConcepts": ["string"],
  "keyTakeaways": ["string"],
  "sections": [
    {
      "heading": "string",
      "paragraph": "string",
      "points": ["string"],
      "subsections": [
        {
          "heading": "string",
          "points": ["string"]
        }
      ]
    }
  ],
  "relatedTopics": ["string"]
}

Rules:
- The title must be clear and topic-based.
- The introduction must define the topic in 2 to 3 short lines maximum.
- "analogyCard" must explain the topic using a real-world intuition.
- "formulaBlock" should be filled when there is a formula, law, equation, or technical relation. If not relevant, return empty strings and an empty variables array.
- "frameworkCards" must contain 2 to 4 compact conceptual cards.
- "coreConcepts" must have 3 to 5 exam-ready bullets.
- "keyTakeaways" must contain 3 to 5 short revision chips.
- Generate 3 to 5 explanatory sections with H2-style headings.
- Each section should be more detailed than summary mode while still using short paragraphs and bullets.
- Add subsections for complex ideas, mechanisms, classifications, or examples.
- Use simple but precise language. No fluff.
- ${relatedTopicsInstruction(language)}
- Avoid markdown, prose outside JSON, and code fences.

Source:
${sourceText}
`.trim();
}

export function assignmentPrompt(sourceText: string, language: LanguageMode, webContext?: string) {
  return `
You are Saar AI, an AI study assistant for Indian students.
${languageInstruction(language)}
${validationRules}
${webContextBlock(webContext)}

Generate a short assignment with model answers.
Return valid JSON only in this shape:
{
  "title": "string",
  "introduction": "string",
  "coreConcepts": ["string"],
  "instructionList": ["string"],
  "markingScheme": [
    {
      "label": "string",
      "value": "string"
    }
  ],
  "sectionGroups": [
    {
      "heading": "string",
      "description": "string",
      "marks": 0,
      "questions": [
        {
          "question": "string",
          "answer": "string",
          "type": "mcq",
          "options": [
            { "label": "A", "text": "string" },
            { "label": "B", "text": "string" },
            { "label": "C", "text": "string" },
            { "label": "D", "text": "string" }
          ],
          "marks": 0
        }
      ]
    }
  ],
  "relatedTopics": ["string"]
}

Rules:
- The title must be clear and topic-based.
- The introduction must be short and formal.
- "coreConcepts" must contain 3 to 5 crisp bullets that frame the assignment.
- "instructionList" must contain 3 to 5 short instructions.
- "markingScheme" must contain 3 compact rows for the right sidebar.
- Create exactly 2 sectionGroups: "Section A" with 2 MCQs and "Section B" with 2 analytical questions.
- MCQs must include exactly 4 options each.
- Analytical questions should use type "analytical" and an empty options array.
- Every sectionGroup must have a heading, short description, marks, and questions.
- Do not return empty strings or empty sectionGroups.
- Answers should be concise but complete.
- ${relatedTopicsInstruction(language)}
- Avoid markdown, prose outside JSON, and code fences.

Source:
${sourceText}
`.trim();
}

export function revisionPrompt(sourceText: string, language: LanguageMode, webContext?: string) {
  return `
You are Saar AI, an AI study assistant for Indian students.
${languageInstruction(language)}
${validationRules}
${webContextBlock(webContext)}

Generate a comprehensive test for revision based on the content.
Return valid JSON only in this shape:
{
  "mcqs": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ],
  "shortQuestions": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "keyConcepts": [
    {
      "term": "string",
      "definition": "string"
    }
  ]
}

Rules:
- Generate exactly 3 MCQs. The 'answer' must exactly match one of the 'options'.
- Generate exactly 3 shortQuestions.
- Extract 3 to 4 keyConcepts for quick recall.
- Keep language consistent with the selected mode.
- Avoid markdown, prose outside JSON, and code fences.

Source:
${sourceText}
`.trim();
}
