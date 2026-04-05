interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
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

const provider = process.env.AI_PROVIDER ?? "gemini";
const providerDefaults = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/",
    model: "llama-3.1-8b-instant",
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

export async function createChatCompletion(prompt: string) {
  if (!apiKey) {
    throw new AIClientError(
      provider === "groq"
        ? "Missing GROQ_API_KEY. Add it to your environment before using Saar AI."
        : "Missing GEMINI_API_KEY. Add it to your environment before using Saar AI."
    );
  }

  const endpoint = new URL("chat/completions", baseUrl).toString();
  const payload: ChatCompletionRequest = {
    model,
    temperature: 0.4,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: "You return only valid JSON and no surrounding commentary."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AIClientError(`AI request failed with ${response.status}: ${details || "Unknown error"}`);
  }

  const result = (await response.json()) as ChatCompletionResponse;
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new AIClientError("AI response was empty.");
  }

  return {
    content,
    provider,
    model
  };
}
