import { z } from "zod";
import type { HymnalAnalysis } from "./types";
import { estimateBarBoxes, normalizeBox } from "./display";
import { mapAnalysis } from "./guitar/mapChords";
import { parseJsonFromText } from "./jsonRepair";

export { parseJsonFromText };

const BarSchema = z.object({
  bar: z.coerce.number().int().positive(),
  lyrics: z.string().optional(),
  pianoChord: z.string().min(1),
  guitarChord: z.string().optional(),
  function: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  x: z.coerce.number().optional(),
  y: z.coerce.number().optional(),
  w: z.coerce.number().optional(),
  h: z.coerce.number().optional(),
});

const AnalysisSchema = z.object({
  title: z.string().optional(),
  hymnNumber: z.string().optional(),
  key: z.string().min(1).default("C"),
  sharps: z.coerce.number().int().min(0).max(7).optional(),
  flats: z.coerce.number().int().min(0).max(7).optional(),
  timeSignature: z.string().min(1).default("4/4"),
  bars: z.array(BarSchema).default([]),
  notes: z.string().optional(),
  overallConfidence: z.coerce.number().min(0).max(1).optional(),
});

function cleanNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.+-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function cleanText(value: unknown, max = 80) {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || /(.)\1{8,}/.test(text)) return undefined;
  return text.slice(0, max);
}

function normalizeRawBar(bar: unknown, index: number) {
  if (!bar || typeof bar !== "object") return null;
  const value = bar as Record<string, unknown>;
  const pianoChord = String(
    value.pianoChord ?? value.guitarChord ?? value.chord ?? "",
  )
    .replace(/0{6,}/g, "")
    .trim();
  if (!pianoChord || pianoChord.length > 24) return null;
  const barNumber = cleanNumber(value.bar);
  const confidence = cleanNumber(value.confidence);
  return {
    bar: barNumber && barNumber > 0 ? Math.round(barNumber) : index + 1,
    pianoChord,
    guitarChord: cleanText(value.guitarChord, 24),
    lyrics: cleanText(value.lyrics, 48),
    function: cleanText(value.function, 16),
    confidence:
      confidence != null && confidence >= 0 && confidence <= 1
        ? confidence
        : undefined,
    x: cleanNumber(value.x),
    y: cleanNumber(value.y),
    w: cleanNumber(value.w),
    h: cleanNumber(value.h),
  };
}

export function validateAnalysis(raw: unknown, truncated = false): HymnalAnalysis {
  const candidate =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const incoming = Array.isArray(candidate.bars) ? candidate.bars : [];
  const normalized = incoming
    .map((bar, index) => normalizeRawBar(bar, index))
    .filter((bar): bar is NonNullable<typeof bar> => bar !== null);
  const bars = [];
  for (const bar of normalized) {
    const parsed = BarSchema.safeParse(bar);
    if (parsed.success) {
      bars.push(parsed.data);
      continue;
    }
    console.warn("[bar dropped]", parsed.error.issues[0], bar);
  }
  if (incoming.length && bars.length === 0) {
    console.warn("[analyze] dropped all bars", incoming[0]);
  }
  try {
    const parsed = AnalysisSchema.parse({ ...candidate, bars });
    const estimated = estimateBarBoxes(parsed.bars.length);
    const notes = [
      parsed.notes,
      truncated
        ? "Some later measures may be missing — crop closer to the staves and read again."
        : null,
    ]
      .filter(Boolean)
      .join(" ");
    const analysis: HymnalAnalysis = {
      ...parsed,
      notes: notes || undefined,
      bars: parsed.bars.map((bar, index) => {
        const box = normalizeBox(bar.x, bar.y, bar.w, bar.h) ?? estimated[index];
        return {
          ...bar,
          guitarChord: bar.guitarChord || bar.pianoChord,
          ...box,
        };
      }),
    };
    return mapAnalysis(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        "The hymn read came back incomplete. Crop closer to the staves and try again.",
      );
    }
    throw error;
  }
}
