const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"];
const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"];

const MAJOR: Record<string, { count: number; kind: "sharp" | "flat" | "none" }> = {
  C: { count: 0, kind: "none" },
  G: { count: 1, kind: "sharp" },
  D: { count: 2, kind: "sharp" },
  A: { count: 3, kind: "sharp" },
  E: { count: 4, kind: "sharp" },
  B: { count: 5, kind: "sharp" },
  "F#": { count: 6, kind: "sharp" },
  "C#": { count: 7, kind: "sharp" },
  F: { count: 1, kind: "flat" },
  Bb: { count: 2, kind: "flat" },
  Eb: { count: 3, kind: "flat" },
  Ab: { count: 4, kind: "flat" },
  Db: { count: 5, kind: "flat" },
  Gb: { count: 6, kind: "flat" },
  Cb: { count: 7, kind: "flat" },
};

const MINOR_TO_RELATIVE: Record<string, string> = {
  A: "C",
  E: "G",
  B: "D",
  "F#": "A",
  "C#": "E",
  "G#": "B",
  D: "F",
  G: "Bb",
  C: "Eb",
  F: "Ab",
  Bb: "Db",
  Eb: "Gb",
};

export type KeySignatureInfo = {
  label: string;
  signature: string;
  accidentals: string;
};

function namesFor(kind: "sharp" | "flat" | "none", count: number) {
  if (kind === "none" || count <= 0) return [];
  const order = kind === "sharp" ? SHARP_ORDER : FLAT_ORDER;
  return order.slice(0, Math.min(7, count));
}

function describe(
  label: string,
  kind: "sharp" | "flat" | "none",
  count: number,
): KeySignatureInfo {
  if (kind === "none" || count <= 0) {
    return { label, signature: "no sharps or flats", accidentals: "♮" };
  }
  return {
    label,
    signature: `${count} ${kind}${count === 1 ? "" : "s"}`,
    accidentals: namesFor(kind, count).join("  "),
  };
}

export function keySignatureInfo(
  key: string,
  sharps?: number,
  flats?: number,
): KeySignatureInfo {
  const trimmed = key.trim() || "C";
  const minor = /\bmin(or)?\b/i.test(trimmed);
  const tonicMatch = trimmed
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .match(/^([A-G][#b]?)/i);
  const tonic = tonicMatch
    ? `${tonicMatch[1][0].toUpperCase()}${tonicMatch[1].slice(1)}`
    : "C";
  const quality = minor ? "minor" : "major";
  const label = `${tonic} ${quality}`;

  if (typeof sharps === "number" && sharps > 0) {
    return describe(label, "sharp", sharps);
  }
  if (typeof flats === "number" && flats > 0) {
    return describe(label, "flat", flats);
  }
  if (sharps === 0 || flats === 0) {
    return describe(label, "none", 0);
  }

  const majorTonic = minor ? (MINOR_TO_RELATIVE[tonic] ?? tonic) : tonic;
  const info = MAJOR[majorTonic] ?? MAJOR.C;
  return describe(label, info.kind, info.count);
}
