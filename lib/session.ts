import type { ChartPayload } from "./types";

const KEY = "chordify-chart-v1";

export function saveChart(payload: ChartPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadChart(): ChartPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChartPayload;
  } catch {
    return null;
  }
}

export function clearChart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
