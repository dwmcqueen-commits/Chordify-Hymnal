import type { HymnalAnalysis } from "./types";
import { flattenApiError } from "./gemini";

export async function analyzeHymnal(blob: Blob): Promise<HymnalAnalysis> {
  const form = new FormData();
  form.append("image", blob, "hymnal.jpg");

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as HymnalAnalysis & { error?: string };
  if (!res.ok) {
    throw new Error(flattenApiError(data.error || "Couldn’t read this page."));
  }
  return data;
}
