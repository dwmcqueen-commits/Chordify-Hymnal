import OpenAI from "openai";
import {
  HYMNAL_SYSTEM_PROMPT,
  HYMNAL_USER_PROMPT,
} from "@/lib/prompts/hymnal";
import { flattenApiError, generateHymnalJson } from "@/lib/gemini";
import { parseJsonFromText, validateAnalysis } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

async function readOnce(
  apiKey: string,
  base64: string,
  mimeType: string,
  thinkingLevel: "low" | "medium",
  extraPrompt = "",
) {
  const result = await generateHymnalJson({
    apiKey,
    base64,
    mimeType,
    thinkingLevel,
    prompt: `${HYMNAL_SYSTEM_PROMPT}\n\n${HYMNAL_USER_PROMPT}${extraPrompt}`,
  });
  const raw = parseJsonFromText(result.text);
  logRaw(raw);
  return {
    raw,
    truncated: result.truncated,
  };
}

function rawBarCount(raw: unknown) {
  return Array.isArray((raw as { bars?: unknown }).bars)
    ? (raw as { bars: unknown[] }).bars.length
    : 0;
}

async function analyzeWithGemini(base64: string, mimeType: string) {
  const apiKey = readKey("GEMINI_API_KEY");
  const first = await readOnce(apiKey, base64, mimeType, "low");
  const firstBars = rawBarCount(first.raw);
  if (firstBars >= 6) return first;

  console.info(`[analyze] only ${firstBars} bars, retrying for the full page`);
  return readOnce(
    apiKey,
    base64,
    mimeType,
    "medium",
    `\n\nCRITICAL: The previous read returned only ${firstBars} measure(s). A hymnal page almost always has 8–16 printed measures. Walk every system top to bottom, left to right, and return one bars[] item for EVERY visible measure. Do not stop after the first chord.`,
  );
}

function logRaw(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    console.info("[analyze raw]", typeof raw);
    return;
  }
  const value = raw as Record<string, unknown>;
  const bars = Array.isArray(value.bars) ? value.bars : [];
  console.info(
    "[analyze raw]",
    value.title ?? "(untitled)",
    value.key,
    `${bars.length} raw bars`,
    bars[0] ? Object.keys(bars[0] as object).join(",") : "none",
  );
}

async function analyzeWithOpenAI(base64: string, mimeType: string) {
  const openai = new OpenAI({ apiKey: readKey("OPENAI_API_KEY") });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.2,
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HYMNAL_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: HYMNAL_USER_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no text.");
  return parseJsonFromText(text);
}

function readKey(name: "GEMINI_API_KEY" | "OPENAI_API_KEY") {
  return process.env[name]?.trim() || "";
}

export async function POST(request: Request) {
  const geminiKey = readKey("GEMINI_API_KEY");
  const openaiKey = readKey("OPENAI_API_KEY");

  if (!geminiKey && !openaiKey) {
    return Response.json(
      {
        error:
          "GEMINI_API_KEY is empty. Paste it on that line in .env.local, save the file (Ctrl+S), then restart npm run dev.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a photo upload." }, { status: 400 });
  }

  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "Attach a hymnal photo." }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return Response.json(
      { error: "That photo is too large. Crop closer to the staves." },
      { status: 413 },
    );
  }

  const mimeType = image.type || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    return Response.json({ error: "Please upload a photo." }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const result = geminiKey
      ? await analyzeWithGemini(base64, mimeType)
      : {
          raw: await analyzeWithOpenAI(base64, mimeType),
          truncated: false,
        };
    const analysis = validateAnalysis(result.raw, result.truncated);
    console.info(
      "[analyze]",
      analysis.title ?? "(untitled)",
      analysis.key,
      `${analysis.bars.length} bars`,
    );

    if (analysis.bars.length === 0) {
      return Response.json(
        {
          error:
            analysis.notes ||
            "Couldn’t read this page. Fill the frame, avoid glare, and crop to the staves.",
        },
        { status: 422 },
      );
    }

    return Response.json(analysis);
  } catch (error) {
    console.error("analyze failed", flattenApiError(error));
    return Response.json(
      { error: flattenApiError(error) },
      { status: 502 },
    );
  }
}
