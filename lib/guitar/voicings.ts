import { parseChord, wrapPc } from "./chords";

export type Fret = number | "x";

export type Voicing = {
  name: string;
  frets: Fret[];
  baseFret: number;
};

const OPEN: Record<string, Fret[]> = {
  C: ["x", 3, 2, 0, 1, 0],
  Cmaj7: ["x", 3, 2, 0, 0, 0],
  C7: ["x", 3, 2, 3, 1, 0],
  Csus4: ["x", 3, 3, 0, 1, 1],
  D: ["x", "x", 0, 2, 3, 2],
  Dm: ["x", "x", 0, 2, 3, 1],
  D7: ["x", "x", 0, 2, 1, 2],
  Dsus2: ["x", "x", 0, 2, 3, 0],
  Dsus4: ["x", "x", 0, 2, 3, 3],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Esus4: [0, 2, 2, 2, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: ["x", "x", 3, 2, 1, 0],
  Fm: [1, 3, 3, 1, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  Gsus4: [3, 3, 0, 0, 1, 3],
  A: ["x", 0, 2, 2, 2, 0],
  Am: ["x", 0, 2, 2, 1, 0],
  A7: ["x", 0, 2, 0, 2, 0],
  Asus2: ["x", 0, 2, 2, 0, 0],
  Asus4: ["x", 0, 2, 2, 3, 0],
  B7: ["x", 2, 1, 2, 0, 2],
  Bm: ["x", 2, 4, 4, 3, 2],
  B: ["x", 2, 4, 4, 4, 2],
};

const E_SHAPE_ROOT_PC = 4; // open E
const A_SHAPE_ROOT_PC = 9; // open A

function addFret(fret: Fret, n: number): Fret {
  if (fret === "x") return "x";
  return fret + n;
}

function eShape(quality: string, fret: number): Fret[] | null {
  const shapes: Record<string, number[]> = {
    "": [0, 2, 2, 1, 0, 0],
    m: [0, 2, 2, 0, 0, 0],
    "7": [0, 2, 0, 1, 0, 0],
    m7: [0, 2, 0, 0, 0, 0],
    maj7: [0, 2, 1, 1, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
    dim: [0, 1, 2, 0, 2, 0],
    aug: [0, 3, 2, 1, 1, 0],
  };
  const shape = shapes[quality];
  if (!shape) return null;
  return shape.map((f) => addFret(f, fret));
}

function aShape(quality: string, fret: number): Fret[] | null {
  const shapes: Record<string, Fret[]> = {
    "": ["x", 0, 2, 2, 2, 0],
    m: ["x", 0, 2, 2, 1, 0],
    "7": ["x", 0, 2, 0, 2, 0],
    m7: ["x", 0, 2, 0, 1, 0],
    maj7: ["x", 0, 2, 1, 2, 0],
    sus4: ["x", 0, 2, 2, 3, 0],
    sus2: ["x", 0, 2, 2, 0, 0],
  };
  const shape = shapes[quality];
  if (!shape) return null;
  return shape.map((f) => addFret(f, fret));
}

function barreVoicing(rootPc: number, quality: string): Fret[] | null {
  const eFret = wrapPc(rootPc - E_SHAPE_ROOT_PC);
  const aFret = wrapPc(rootPc - A_SHAPE_ROOT_PC);

  const e = eFret === 0 ? eShape(quality, 0) : eShape(quality, eFret);
  const a = aFret === 0 ? aShape(quality, 0) : aShape(quality, aFret);

  const candidates = [
    { frets: e, max: eFret },
    { frets: a, max: aFret },
  ].filter((c) => c.frets);

  if (candidates.length === 0) return eShape(quality === "m7b5" ? "m7" : quality, eFret || 1);

  candidates.sort((x, y) => x.max - y.max);
  return candidates[0].frets ?? null;
}

export function voicingFor(symbol: string): Voicing | null {
  const first = symbol.trim().split(/\s+/)[0];
  if (!first) return null;

  const parsed = parseChord(first);
  if (!parsed) return null;

  const quality = parsed.quality;
  const openName = `${parsed.root}${quality}`;
  const open = OPEN[openName];
  if (open) {
    return { name: first, frets: open, baseFret: 1 };
  }

  const frets = barreVoicing(parsed.rootPc, quality);
  if (!frets) return null;

  const numeric = frets.filter((f): f is number => f !== "x");
  const min = numeric.length ? Math.min(...numeric.filter((n) => n > 0), 1) : 1;
  const max = numeric.length ? Math.max(...numeric) : 1;
  const baseFret = max <= 4 ? 1 : min || 1;

  return { name: first, frets, baseFret };
}

export function uniqueChordNames(symbols: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const symbol of symbols) {
    for (const part of symbol.split(/\s+/)) {
      if (!part || seen.has(part)) continue;
      seen.add(part);
      out.push(part);
    }
  }
  return out;
}
