export function displayTitle(title?: string) {
  if (!title) return "Untitled hymn";
  const cleaned = title
    .replace(/\s*zone\/?/gi, " ")
    .replace(/\s*(NEW BRITAIN|CM|L\.?M\.?|S\.?M\.?).*$/i, "")
    .replace(/\s*\d+\.\d+\.\d+(\.\d+)?.*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || "Untitled hymn";
}

export function displayHymnNumber(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{1,4}[a-z]?$/i.test(trimmed)) return trimmed;
  return null;
}

export function displayTimeSignature(value?: string) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

export function normalizeBox(x?: number, y?: number, w?: number, h?: number) {
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof w !== "number" ||
    typeof h !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(w) ||
    !Number.isFinite(h)
  ) {
    return null;
  }

  const scale = Math.max(x, y, w, h) > 1.5 ? (Math.max(x, y, w, h) > 100 ? 1000 : 100) : 1;
  const box = {
    x: clamp01(x / scale),
    y: clamp01(y / scale),
    w: clamp01(w / scale),
    h: clamp01(h / scale),
  };
  if (box.w < 0.02 || box.h < 0.02) return null;
  if (box.x + box.w > 1) box.w = 1 - box.x;
  if (box.y + box.h > 1) box.h = 1 - box.y;
  return box;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function estimateBarBoxes(count: number) {
  const perSystem = 4;
  const systems = Math.max(1, Math.ceil(count / perSystem));
  const top = 0.14;
  const usable = 0.78;
  const systemH = usable / systems;
  const left = 0.07;
  const width = 0.86;

  return Array.from({ length: count }, (_, index) => {
    const system = Math.floor(index / perSystem);
    const col = index % perSystem;
    const cols = Math.min(perSystem, count - system * perSystem);
    return {
      x: left + (col / cols) * width,
      y: top + system * systemH + systemH * 0.08,
      w: width / cols,
      h: systemH * 0.52,
    };
  });
}
