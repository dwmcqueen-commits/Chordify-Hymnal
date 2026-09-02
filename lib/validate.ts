import { z } from "zod";
import type { HymnalAnalysis } from "./types";
import { mapAnalysis } from "./guitar/mapChords";

const BarSchema = z.object({
  bar: z.number().int().positive(),
  lyrics: z.string().optional(),
  pianoChord: z.string().min(1),
  guitarChord: z.string().optional(),
  function: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const AnalysisSchema = z.object({
  title: z.string().optional(),
  hymnNumber: z.string().optional(),
  key: z.string().min(1),
  timeSignature: z.string().min(1),
  bars: z.array(BarSchema),
  notes: z.string().optional(),
  overallConfidence: z.number().min(0).max(1).optional(),
});

export function parseJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("The model returned an empty response.");

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) return JSON.parse(fenced[1].trim());
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Could not parse harmony JSON from the model.");
  }
}

export function validateAnalysis(raw: unknown): HymnalAnalysis {
  const parsed = AnalysisSchema.parse(raw);
  const analysis: HymnalAnalysis = {
    ...parsed,
    bars: parsed.bars.map((bar) => ({
      ...bar,
      guitarChord: bar.guitarChord || bar.pianoChord,
    })),
  };
  return mapAnalysis(analysis);
}
