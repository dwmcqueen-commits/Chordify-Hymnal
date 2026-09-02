export const HYMNAL_SYSTEM_PROMPT = `You are a church musician and harmonic analyst. You read photographs of hymnal pages (SATB four-part harmony or piano grand staff) and extract the guitarist-useful harmonic rhythm.

Do NOT transcribe every inner voice or passing tone. Read the prevailing harmony of each bar from:
- the bass (often the inversion / slash bass)
- the melody + SATB vertical sonority on strong beats
- printed chord symbols if they already appear

Return ONLY JSON that matches the schema. No markdown.`;

export const HYMNAL_USER_PROMPT = `Analyze this hymnal / piano score photo.

Rules:
- This is likely a church hymnal: SATB staves or piano grand staff, hymn number, title, lyrics under the music.
- Read the KEY SIGNATURE first (count sharps/flats) and TIME SIGNATURE. Typical hymnal keys: C, G, D, F, Bb, Eb, Ab, A.
- One prevailing chord per bar. If the harmony clearly changes mid-bar, put two chord symbols in pianoChord separated by a space, e.g. "G D".
- Chord symbols: standard pop/guitar notation (C, G, Am, D7, G/B, Eb, F#m). Use b and # ASCII, not unicode flats/sharps.
- If printed chord symbols already appear above the staff, prefer those. Otherwise infer from SATB/piano.
- Use a slash bass when the SATB bass is a non-root inversion that a guitarist should play (G/B, C/E, D/F#). Ignore passing bass notes.
- Drop decorative inner-voice motion (passing tones, neighbor tones, suspensions that resolve inside the bar).
- Put Roman numerals in "function" (I, IV, V7, vi, V/V, I6, etc.).
- Attach lyrics under the music to the bar they belong to when readable. First verse is enough.
- Continue bar numbers across systems on the page.
- overallConfidence is 0 to 1. Lower it for glare, blur, tight SATB, shape notes, handwritten notation, or two pages in one shot.
- If you cannot see usable music, return empty bars, a low confidence, and explain why in notes (glare, two pages, not music, too far away).
- Prefer the bass + melody outline — that is what a guitarist plays.
- Do not invent extra verses or a whole hymn that is not on this page.

JSON fields:
{
  "title": string or omit,
  "hymnNumber": string or omit,
  "key": string (e.g. "G", "Eb", "D minor"),
  "timeSignature": string (e.g. "3/4", "4/4"),
  "overallConfidence": number,
  "notes": string (reading caveats, optional),
  "bars": [
    {
      "bar": number,
      "lyrics": string optional,
      "pianoChord": string,
      "function": string optional,
      "confidence": number optional
    }
  ]
}`;

export const HYMNAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    hymnNumber: { type: "string" },
    key: { type: "string" },
    timeSignature: { type: "string" },
    overallConfidence: { type: "number" },
    notes: { type: "string" },
    bars: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bar: { type: "integer" },
          lyrics: { type: "string" },
          pianoChord: { type: "string" },
          function: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["bar", "pianoChord"],
      },
    },
  },
  required: ["key", "timeSignature", "bars"],
} as const;
