import type { ChartPayload } from "./types";

const KEY = "chordify-chart-v1";
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedPayload: ChartPayload | null = null;
let liveImage: string | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeChart(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function saveChart(payload: ChartPayload) {
  if (typeof window === "undefined") return;
  liveImage = payload.image ?? liveImage;
  const next: ChartPayload = {
    ...payload,
    image: payload.image ?? liveImage ?? undefined,
  };
  cachedPayload = next;
  try {
    const raw = JSON.stringify(next);
    sessionStorage.setItem(KEY, raw);
    cachedRaw = raw;
  } catch {
    sessionStorage.setItem(KEY, JSON.stringify({ analysis: next.analysis }));
    cachedRaw = null;
  }
  emit();
}

export function loadChart(): ChartPayload | null {
  if (typeof window === "undefined") return null;
  if (cachedPayload) return cachedPayload;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    cachedRaw = raw;
    const parsed = JSON.parse(raw) as ChartPayload;
    cachedPayload = {
      ...parsed,
      image: parsed.image || liveImage || undefined,
    };
    return cachedPayload;
  } catch {
    cachedRaw = null;
    cachedPayload = null;
    return null;
  }
}

export function clearChart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  cachedRaw = null;
  cachedPayload = null;
  liveImage = null;
  emit();
}
