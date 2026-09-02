import { HYMNAL_JSON_SCHEMA } from "./prompts/hymnal";

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
].filter((m): m is string => Boolean(m));

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

export async function generateHymnalJson(options: {
  apiKey: string;
  base64: string;
  mimeType: string;
  prompt: string;
}): Promise<unknown> {
  let lastMessage = "Gemini could not read the page.";

  for (const model of GEMINI_MODELS) {
    try {
      return await generateOnce(model, options);
    } catch (error) {
      lastMessage = flattenApiError(error);
      if (isRetryableModelError(lastMessage)) continue;
      throw new Error(friendlyGeminiMessage(lastMessage));
    }
  }

  throw new Error(friendlyGeminiMessage(lastMessage));
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
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: HYMNAL_JSON_SCHEMA,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Gemini ${model} failed (${response.status}).`);
  }

  const payload = JSON.parse(text) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const output = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!output) throw new Error("Gemini returned no text.");
  return output;
}
