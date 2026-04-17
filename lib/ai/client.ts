// AI Configuration Client - Re-triggering build
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object";
  };
}

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

const provider = process.env.AI_PROVIDER ?? "cohere";
const groqFallbackModels = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
] as const;

const providerDefaults = {
  cohere: {
    baseUrl: "https://api.cohere.ai/compatibility/v1/",
    model: "command-a-03-2025",
    apiKey: process.env.COHERE_API_KEY
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/",
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY
  }
} as const;

const selectedProvider = providerDefaults[provider as keyof typeof providerDefaults] ?? providerDefaults.gemini;
const baseUrl = process.env.AI_BASE_URL ?? selectedProvider.baseUrl;
const model = process.env.AI_MODEL ?? selectedProvider.model;
const apiKey = selectedProvider.apiKey;

export class AIClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIClientError";
  }
}

function getModelCandidates() {
  if (provider !== "groq") {
    return [model];
  }

  const preferredModel = process.env.AI_MODEL;
  const defaults = Array.from(new Set([selectedProvider.model, ...groqFallbackModels]));

  if (preferredModel) {
    // Put preferred first, then everything else from fallbacks (removing dupe of preferred)
    return [preferredModel, ...defaults.filter(m => m !== preferredModel)];
  }

  return defaults;
}

export async function createChatCompletion(prompt: string, customMaxTokens?: number) {
  if (!apiKey) {
    throw new AIClientError(
      provider === "groq"
        ? "Missing GROQ_API_KEY. Add it to your environment before using Saar AI."
        : provider === "gemini"
        ? "Missing GEMINI_API_KEY. Add it to your environment before using Saar AI."
        : "Missing COHERE_API_KEY. Add it to your environment before using Saar AI."
    );
  }

  const modelCandidates = getModelCandidates();
  let lastError = "";

  for (const candidateModel of modelCandidates) {
    const endpointUrl = new URL("chat/completions", baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let endpoint = "";
    let fetchPayload: any = {};

    if (provider === "gemini") {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey}`;
      fetchPayload = {
        systemInstruction: {
          parts: [{ text: "You return only valid JSON and no surrounding commentary." }]
        },
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: customMaxTokens ?? 3500,
          temperature: 0.4,
          responseMimeType: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" }
            }
          }
        }
      };
    } else {
      const endpointUrl = new URL("chat/completions", baseUrl);
      headers["Authorization"] = `Bearer ${apiKey}`;
      endpoint = endpointUrl.toString();
      fetchPayload = {
        model: candidateModel,
        temperature: 0.4,
        max_tokens: customMaxTokens ?? 3500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You return only valid JSON and no surrounding commentary." },
          { role: "user", content: prompt }
        ]
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(fetchPayload),
      cache: "no-store"
    });

    if (!response.ok) {
      const details = await response.text();
      lastError = `AI request failed with ${response.status}: ${details || "Unknown error"}`;

      if (provider === "groq" && response.status === 429 && candidateModel !== modelCandidates.at(-1)) {
        continue;
      }

      throw new AIClientError(lastError);
    }

    const result = await response.json();
    let content = "";

    if (provider === "gemini") {
      content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } else {
      content = (result as ChatCompletionResponse).choices?.[0]?.message?.content ?? "";
    }

    if (!content) {
      lastError = "AI response was empty.";
      continue;
    }

    return {
      content,
      provider,
      model: candidateModel
    };
  }

  throw new AIClientError(lastError || "AI response was empty.");
}
