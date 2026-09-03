function tryParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unescapedQuoteCount(text: string) {
  let count = 0;
  let escape = false;
  for (const ch of text) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') count += 1;
  }
  return count;
}

function closeOpenString(text: string) {
  return unescapedQuoteCount(text) % 2 === 1 ? `${text}"` : text;
}

function stripIncompleteTail(text: string) {
  let s = closeOpenString(text.trim()).replace(/,\s*$/, "");
  s = s.replace(/:\s*$/, "");
  s = s.replace(/,\s*"[^"\\]*"\s*$/, "");
  s = s.replace(/,\s*\{[^{}]*$/, "");
  s = s.replace(/:\s*\[\s*\{[^{}]*$/, ":[]");
  s = s.replace(/,\s*$/, "");
  return s;
}

function closeOpenBrackets(text: string) {
  const closers: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") closers.push("}");
    else if (ch === "[") closers.push("]");
    else if (ch === "}" || ch === "]") closers.pop();
  }
  return inString ? `${text}"${closers.reverse().join("")}` : `${text}${closers.reverse().join("")}`;
}

export function repairTruncatedJson(text: string): string {
  const start = text.indexOf("{");
  const body = start >= 0 ? text.slice(start) : text;
  return closeOpenBrackets(stripIncompleteTail(body));
}

export function salvageHymnalShape(text: string): unknown | null {
  const key = text.match(/"key"\s*:\s*"([^"]+)"/)?.[1];
  const timeSignature =
    text.match(/"timeSignature"\s*:\s*"([^"]+)"/)?.[1] ?? "4/4";
  const title = text.match(/"title"\s*:\s*"([^"]+)"/)?.[1];
  const hymnNumber = text.match(/"hymnNumber"\s*:\s*"([^"]+)"/)?.[1];
  const bars: unknown[] = [];
  const barPattern =
    /\{\s*"bar"\s*:\s*(\d+)[\s\S]*?"pianoChord"\s*:\s*"([^"]+)"[\s\S]*?\}/g;
  for (const match of text.matchAll(barPattern)) {
    const parsed = tryParse(match[0]);
    if (parsed && typeof parsed === "object") {
      bars.push(parsed);
      continue;
    }
    bars.push({
      bar: Number(match[1]),
      pianoChord: match[2],
    });
  }
  if (!key && bars.length === 0) return null;
  return {
    title,
    hymnNumber,
    key: key || "C",
    timeSignature,
    bars,
    notes: "Some later measures may be missing — the read was cut off.",
  };
}

export function parseJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("The model returned an empty response.");

  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== null) return parsed;
  }

  const repaired = tryParse(repairTruncatedJson(trimmed));
  if (repaired !== null) return repaired;

  const salvaged = salvageHymnalShape(trimmed);
  if (salvaged !== null) return salvaged;

  console.error(
    "[json] parse failed",
    trimmed.slice(0, 180).replace(/\s+/g, " "),
    "…",
    trimmed.slice(-180).replace(/\s+/g, " "),
  );
  throw new Error(
    "The hymn read was cut off before it finished. Crop closer to the staves and try again.",
  );
}
