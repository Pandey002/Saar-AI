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
    model: "gemini-1.5-flash-latest",
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

function getModelCandidates(): string[] {
  const preferredModel = process.env.AI_MODEL;
  const defaults = provider === "groq" 
    ? [providerDefaults.groq.model, ...groqFallbackModels]
    : [providerDefaults[provider as keyof typeof providerDefaults]?.model ?? "gemini-1.5-flash-latest"];

  if (preferredModel) {
    return [preferredModel, ...defaults.filter(m => m !== preferredModel)];
  }

  return defaults;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(endpoint: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retryCount = 0;
  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) return response;

      if (response.status === 429) {
        retryCount++;
        if (retryCount <= maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          console.warn(`Rate limited (429). Retrying in ${Math.round(delay)}ms... (Attempt ${retryCount}/${maxRetries})`);
          await sleep(delay);
          continue;
        }
      }
      return response;
    } catch (err: any) {
      retryCount++;
      if (retryCount <= maxRetries) {
        await sleep(1000 * retryCount);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function createChatCompletion(prompt: string, customMaxTokens?: number, cacheStrategy: RequestCache = "no-store") {
  if (!apiKey) {
    throw new AIClientError(
      provider === "groq"
        ? "Missing GROQ_API_KEY. Add it to your environment before using Vidya."
        : provider === "gemini"
        ? "Missing GEMINI_API_KEY. Add it to your environment before using Vidya."
        : "Missing COHERE_API_KEY. Add it to your environment before using Vidya."
    );
  }

  const modelCandidates = getModelCandidates();
  let lastError = "";

  for (const candidateModel of modelCandidates) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
          responseMimeType: "application/json"
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

    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(fetchPayload),
      cache: cacheStrategy
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

    return { content };
  }

  throw new AIClientError(lastError || "AI generation failed after all attempts.");
}

export async function createVisionCompletion(prompt: string, base64Images: string[], customMaxTokens?: number) {
  if (!apiKey) {
    throw new AIClientError("Missing API Key for vision tasks.");
  }

  const visionModel = model;
  const imageParts = base64Images.map(dataUri => {
    const match = dataUri.match(/^data:(image\/\w+);base64,([\s\S]+)$/);
    if (!match) throw new AIClientError("Invalid image data URI.");
    return { mimeType: match[1], data: match[2] };
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${visionModel}:generateContent?key=${apiKey}`;
  const fetchPayload = {
    systemInstruction: { parts: [{ text: "You are a Vision AI tutor. You return only valid JSON and no surrounding commentary." }] },
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        ...imageParts.map(img => ({ inline_data: { mime_type: img.mimeType, data: img.data } }))
      ]
    }],
    generationConfig: {
      maxOutputTokens: customMaxTokens ?? 8000,
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const response = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fetchPayload),
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AIClientError(`Vision AI request failed with ${response.status}: ${details}`);
  }

  const result = await response.json();
  const contentResponse = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!contentResponse) throw new AIClientError("Vision AI returned an empty response.");

  return { content: contentResponse, provider, model: visionModel };
}

export async function streamChatCompletion(prompt: string, customMaxTokens?: number): Promise<ReadableStream<string>> {
  if (!apiKey) throw new AIClientError("Missing API Key for streaming.");

  const candidateModel = getModelCandidates()[0];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let endpoint = "";
  let fetchPayload: any = {};

  if (provider === "gemini") {
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
    fetchPayload = {
      systemInstruction: { parts: [{ text: "You are a helpful tutor. Be concise but insightful." }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: customMaxTokens ?? 3500, temperature: 0.4 }
    };
  } else {
    const endpointUrl = new URL("chat/completions", baseUrl);
    headers["Authorization"] = `Bearer ${apiKey}`;
    endpoint = endpointUrl.toString();
    fetchPayload = {
      model: candidateModel,
      stream: true,
      temperature: 0.4,
      max_tokens: customMaxTokens ?? 3500,
      messages: [
        { role: "system", content: "You are a helpful tutor. Be concise but insightful." },
        { role: "user", content: prompt }
      ]
    };
  }

  const response = await fetchWithRetry(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(fetchPayload),
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AIClientError(`Streaming request failed: ${details}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIClientError("Failed to get readable stream.");

  const decoder = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const chunkContent = provider === "gemini" 
                  ? json.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                  : json.choices?.[0]?.delta?.content ?? "";
                if (chunkContent) controller.enqueue(chunkContent);
              } catch {}
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  });
}
