import { HYMNAL_JSON_SCHEMA } from "./prompts/hymnal";

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
].filter((m): m is string => Boolean(m));

export type GeminiJsonResult = {
  text: string;
  truncated: boolean;
};

export function flattenApiError(raw: unknown): string {
  const text =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : JSON.stringify(raw);

  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; status?: string };
      message?: string;
    };
    const message = parsed.error?.message || parsed.message;
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    // already plain text
  }

  return text;
}

function isRetryableModelError(message: string) {
  return /not found|404|NOT_FOUND|no longer available|invalid model|denied access|PERMISSION_DENIED/i.test(
    message,
  );
}

function isThinkingConfigError(message: string) {
  return /thinking[_ ]?(level|budget|config)|ThinkingConfig/i.test(message);
}

export async function generateHymnalJson(options: {
  apiKey: string;
  base64: string;
  mimeType: string;
  prompt: string;
  thinkingLevel?: "minimal" | "low" | "medium";
}): Promise<GeminiJsonResult> {
  let lastMessage = "Gemini could not read the page.";
  const level = options.thinkingLevel ?? "low";

  for (const model of GEMINI_MODELS) {
    for (const thinking of thinkingConfigsFor(model, level)) {
      try {
        return await generateOnce(model, options, thinking);
      } catch (error) {
        lastMessage = flattenApiError(error);
        if (thinking && isThinkingConfigError(lastMessage)) continue;
        if (isRetryableModelError(lastMessage)) break;
        throw new Error(friendlyGeminiMessage(lastMessage));
      }
    }
  }

  throw new Error(friendlyGeminiMessage(lastMessage));
}

function thinkingConfigsFor(
  model: string,
  level: "minimal" | "low" | "medium",
): Array<Record<string, unknown> | undefined> {
  if (/gemini-3/i.test(model) || model.includes("flash-latest")) {
    return [
      { thinkingLevel: level.toUpperCase() },
      { thinkingLevel: level },
      undefined,
    ];
  }
  return [{ thinkingBudget: level === "minimal" ? 0 : 1024 }, undefined];
}

function friendlyGeminiMessage(message: string) {
  if (/quota|429|rate/i.test(message)) {
    return "Gemini hit a rate limit. Wait about a minute and try again.";
  }
  if (/denied access|PERMISSION_DENIED/i.test(message)) {
    return "Google denied this Gemini project. Open Google AI Studio, make sure Gemini API is enabled for that project, create a fresh API key if this one is blocked, paste it into GEMINI_API_KEY, and restart npm run dev.";
  }
  if (/no longer available|not found|NOT_FOUND/i.test(message)) {
    return "Google retired the Gemini model this app was using. Restart npm run dev after pulling the latest code, then try again.";
  }
  return message;
}

async function generateOnce(
  model: string,
  options: {
    apiKey: string;
    base64: string;
    mimeType: string;
    prompt: string;
  },
  thinkingConfig?: Record<string, unknown>,
): Promise<GeminiJsonResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: HYMNAL_JSON_SCHEMA,
  };
  if (thinkingConfig) generationConfig.thinkingConfig = thinkingConfig;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: options.mimeType,
              data: options.base64,
            },
          },
          { text: options.prompt },
        ],
      },
    ],
    generationConfig,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    if (error instanceof Error && /timeout|abort/i.test(`${error.name} ${error.message}`)) {
      throw new Error("The read took too long. Crop closer to the staves and try again.");
    }
    throw error;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Gemini ${model} failed (${response.status}).`);
  }

  const payload = JSON.parse(text) as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
      totalTokenCount?: number;
    };
  };
  const candidate = payload.candidates?.[0];
  const output = candidate?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  const usage = payload.usageMetadata;
  const truncated = candidate?.finishReason === "MAX_TOKENS";

  console.info(
    "[gemini]",
    model,
    candidate?.finishReason ?? "unknown",
    output ? `${output.length} chars` : "empty",
    usage
      ? `prompt=${usage.promptTokenCount ?? "?"} think=${usage.thoughtsTokenCount ?? "?"} out=${usage.candidatesTokenCount ?? "?"}`
      : "",
  );

  if (!output) throw new Error("Gemini returned no text.");
  return { text: output, truncated };
}
