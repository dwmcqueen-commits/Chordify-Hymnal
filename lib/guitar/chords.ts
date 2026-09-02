export type ParsedChord = {
  root: string;
  rootPc: number;
  quality: string;
  bass?: string;
  bassPc?: number;
};

const NAME_TO_PC: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function wrapPc(pc: number) {
  return ((pc % 12) + 12) % 12;
}

export function pcToName(pc: number, preferFlats: boolean) {
  const names = preferFlats ? FLAT : SHARP;
  return names[wrapPc(pc)];
}

export function nameToPc(name: string): number | null {
  const normalized = name
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/♮/g, "");
  if (normalized in NAME_TO_PC) return NAME_TO_PC[normalized];
  return null;
}

export function preferFlatsForKey(key: string): boolean {
  const root = key.trim().split(/\s+/)[0] ?? "C";
  const parsed = parseNoteName(root);
  if (!parsed) return false;
  return parsed.includes("b") || ["F", "Bb", "Eb", "Ab", "Db", "Gb"].includes(parsed);
}

function parseNoteName(raw: string): string | null {
  const m = raw
    .trim()
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .match(/^([A-G])([#b])?/i);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = m[2] ?? "";
  return `${letter}${acc}`;
}

function normalizeQuality(raw: string): string {
  let q = raw.trim();
  q = q.replace(/maj7|Maj7|MAJ7|Δ7|∆7/g, "maj7");
  q = q.replace(/maj(?!7)/gi, "");
  q = q.replace(/min|MIN|-/, "m");
  q = q.replace(/dim7|°7/g, "dim7");
  q = q.replace(/dim|°/g, "dim");
  q = q.replace(/ø7|m7b5|min7b5/gi, "m7b5");
  q = q.replace(/aug|\+/g, "aug");
  q = q.replace(/sus4/gi, "sus4");
  q = q.replace(/sus2/gi, "sus2");
  q = q.replace(/^M7$/, "maj7");
  q = q.replace(/^M$/, "");
  return q;
}

export function parseChord(symbol: string): ParsedChord | null {
  const cleaned = symbol.trim().replace(/♯/g, "#").replace(/♭/g, "b");
  if (!cleaned || cleaned === "N.C." || cleaned === "NC" || cleaned === "%") {
    return null;
  }

  const slash = cleaned.split("/");
  const main = slash[0]?.trim() ?? "";
  const bassRaw = slash[1]?.trim();

  const m = main.match(/^([A-G][#b]?)(.*)$/i);
  if (!m) return null;

  const root = parseNoteName(m[1]);
  if (!root) return null;
  const rootPc = nameToPc(root);
  if (rootPc === null) return null;

  const quality = normalizeQuality(m[2] ?? "");
  const parsed: ParsedChord = { root, rootPc, quality };

  if (bassRaw) {
    const bass = parseNoteName(bassRaw);
    if (bass) {
      const bassPc = nameToPc(bass);
      if (bassPc !== null) {
        parsed.bass = bass;
        parsed.bassPc = bassPc;
      }
    }
  }

  return parsed;
}

export function looksLikeChord(symbol: string): boolean {
  return parseChord(symbol) !== null;
}

export function splitBarChords(symbol: string): string[] {
  const trimmed = symbol.trim();
  if (!trimmed) return [];

  const dashed = trimmed.split(/\s+[–—|-]\s+|\s+\/\s+/);
  if (dashed.length > 1) {
    return dashed.map((s) => s.trim()).filter(Boolean);
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && tokens.every(looksLikeChord)) {
    return tokens;
  }

  return [trimmed];
}

/** Strip piano clutter; keep guitar-useful quality and slash bass. */
export function simplifyQuality(quality: string): string {
  let q = quality;
  q = q.replace(/add(9|11|13)/gi, "");
  q = q.replace(/6\/9/g, "");
  q = q.replace(/maj9/gi, "maj7");
  q = q.replace(/m9/gi, "m7");
  q = q.replace(/9|11|13/g, "7");
  q = q.replace(/6/g, "");
  q = q.replace(/sus$/, "sus4");
  return q;
}

export function formatChord(
  parsed: ParsedChord,
  semitones: number,
  preferFlats: boolean,
): string {
  const root = pcToName(parsed.rootPc + semitones, preferFlats);
  const quality = simplifyQuality(parsed.quality);
  const bass =
    parsed.bassPc !== undefined
      ? pcToName(parsed.bassPc + semitones, preferFlats)
      : undefined;
  return bass ? `${root}${quality}/${bass}` : `${root}${quality}`;
}

export function transposeChord(
  symbol: string,
  semitones: number,
  preferFlats = false,
): string {
  const parts = splitBarChords(symbol);
  return parts
    .map((part) => {
      const parsed = parseChord(part);
      if (!parsed) return part;
      return formatChord(parsed, semitones, preferFlats);
    })
    .join(" ");
}

export function transposeKey(key: string, semitones: number): string {
  const bits = key.trim().split(/\s+/);
  const root = bits[0] ?? "C";
  const rest = bits.slice(1).join(" ");
  const parsed = parseNoteName(root);
  if (!parsed) return key;
  const pc = nameToPc(parsed);
  if (pc === null) return key;
  const flats = preferFlatsForKey(key) || rest.toLowerCase().includes("minor");
  const next = pcToName(pc + semitones, flats);
  return rest ? `${next} ${rest}` : next;
}
