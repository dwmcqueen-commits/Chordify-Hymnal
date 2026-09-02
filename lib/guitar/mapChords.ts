import type { HymnalAnalysis, HymnalBar } from "../types";
import {
  formatChord,
  parseChord,
  preferFlatsForKey,
  splitBarChords,
  transposeChord,
  transposeKey,
} from "./chords";

const OPEN_EASY = new Set([
  "C",
  "Cmaj7",
  "C7",
  "Csus4",
  "D",
  "Dm",
  "D7",
  "Dsus2",
  "Dsus4",
  "E",
  "Em",
  "E7",
  "Esus4",
  "F",
  "Fmaj7",
  "G",
  "G7",
  "Gsus4",
  "A",
  "Am",
  "A7",
  "Asus2",
  "Asus4",
  "B7",
]);

const FRIENDLY_KEYS = new Set(["G", "D", "A", "C", "E", "Em", "Am"]);

function mapOne(symbol: string, key: string): string {
  const parsed = parseChord(symbol);
  if (!parsed) return symbol.trim();
  const flats = preferFlatsForKey(key) || parsed.root.includes("b");
  return formatChord(parsed, 0, flats);
}

export function mapPianoSymbol(pianoChord: string, key: string): string {
  return splitBarChords(pianoChord)
    .map((part) => mapOne(part, key))
    .join(" ");
}

export function mapAnalysis(analysis: HymnalAnalysis): HymnalAnalysis {
  const bars: HymnalBar[] = analysis.bars.map((bar) => ({
    ...bar,
    guitarChord: mapPianoSymbol(bar.pianoChord || bar.guitarChord, analysis.key),
  }));

  const suggestion = suggestCapo(
    bars.map((b) => b.guitarChord),
    analysis.key,
  );

  return {
    ...analysis,
    bars,
    suggestedCapo: suggestion.capo,
    suggestedCapoReason: suggestion.reason,
  };
}

function scoreShapes(chords: string[]): number {
  let score = 0;
  let total = 0;
  for (const symbol of chords) {
    for (const part of splitBarChords(symbol)) {
      total += 1;
      const parsed = parseChord(part);
      if (!parsed) continue;
      const name = `${parsed.root}${parsed.quality}`;
      if (OPEN_EASY.has(name)) score += 3;
      else if (parsed.quality === "" || parsed.quality === "m") score += 1;
    }
  }
  return total === 0 ? 0 : score / total;
}

export function suggestCapo(
  guitarChords: string[],
  key: string,
): { capo: number; reason: string; playAsKey: string } {
  let best = { capo: 0, score: scoreShapes(guitarChords), playAsKey: key };

  for (let capo = 1; capo <= 7; capo += 1) {
    const shifted = guitarChords.map((c) =>
      transposeChord(c, -capo, preferFlatsForKey(transposeKey(key, -capo))),
    );
    const playAsKey = transposeKey(key, -capo);
    let score = scoreShapes(shifted);
    if (FRIENDLY_KEYS.has(playAsKey.split(/\s+/)[0] ?? "")) score += 0.15;
    if (score > best.score + 0.05) {
      best = { capo, score, playAsKey };
    }
  }

  if (best.capo === 0) {
    return {
      capo: 0,
      playAsKey: key,
      reason: "Open chords already sit well in this key.",
    };
  }

  return {
    capo: best.capo,
    playAsKey: best.playAsKey,
    reason: `Capo ${best.capo} lets you play ${best.playAsKey} shapes while sounding in ${key}.`,
  };
}
