export const HYMNAL_SYSTEM_PROMPT = `You are a church musician and harmonic analyst. You read photographs of hymnal pages (SATB four-part harmony or piano grand staff) and extract the guitarist-useful harmonic rhythm.

Do NOT transcribe every inner voice or passing tone. Read the prevailing harmony of each bar from:
- the bass (often the inversion / slash bass)
- the melody + SATB vertical sonority on strong beats
- printed chord symbols if they already appear

Return ONLY JSON that matches the schema. No markdown.`;

export const HYMNAL_USER_PROMPT = `Analyze this hymnal / piano score photo.

Rules:
- This is likely a church hymnal: SATB staves or piano grand staff, hymn number, title, lyrics under the music.
- Read the KEY SIGNATURE first (count sharps or flats at the start of the staff) and TIME SIGNATURE. Typical hymnal keys: C, G, D, F, Bb, Eb, Ab, A.
- "key" must be the concert key of the page, e.g. "G", "Eb", "D minor". Also set "sharps" or "flats" to the number of accidentals in the key signature (use 0 if C major / A minor).
- Return ONE bars[] item for EVERY printed measure on this page. Walk every system top to bottom, left to right. A hymnal page usually has 8–16 measures. NEVER return only the first chord or a single bar if more measures are visible.
- One prevailing chord per bar. If the harmony clearly changes mid-bar, put two chord symbols in pianoChord separated by a space, e.g. "G D".
- Chord symbols: standard pop/guitar notation (C, G, Am, D7, G/B, Eb, F#m). Use b and # ASCII, not unicode flats/sharps.
- If printed chord symbols already appear above the staff, prefer those. Otherwise infer from SATB/piano.
- Use a slash bass when the SATB bass is a non-root inversion that a guitarist should play (G/B, C/E, D/F#). Ignore passing bass notes.
- Drop decorative inner-voice motion (passing tones, neighbor tones, suspensions that resolve inside the bar).
- Put Roman numerals in "function" (I, IV, V7, vi, V/V, I6, etc.).
- Attach lyrics under the music to the bar they belong to when readable. First verse is enough.
- Continue bar numbers across systems on the page.
- For EVERY bar, give the measure box on THIS image as percentages 0-100:
  x = left edge of the barline-to-barline measure
  y = top of the treble/upper staff of that system (not the title, not the lyrics)
  w = width of that measure
  h = from the top staff down through the bass/lower staff (do not include lyrics)
- Boxes must sit on the printed music. One box per bar, in reading order.
- overallConfidence is 0 to 1. Lower it for glare, blur, tight SATB, shape notes, handwritten notation, or two pages in one shot.
- hymnNumber is only the printed hymn number (digits). Never put meter (8.6.8.6), timestamps, or tune names there.
- title is the hymn title only (e.g. Amazing Grace). Do not append the tune name.
- timeSignature is only meter like 3/4 or 4/4.
- If you cannot see usable music, return empty bars, a low confidence, and explain why in notes (glare, two pages, not music, too far away).
- Prefer the bass + melody outline — that is what a guitarist plays.
- Keep JSON compact. Integer boxes 0-100. No commentary.
- Do not invent extra verses or a whole hymn that is not on this page.

JSON fields:
{
  "title": string or omit,
  "hymnNumber": string or omit,
  "key": string (e.g. "G", "Eb", "D minor"),
  "sharps": number (0-7, optional),
  "flats": number (0-7, optional),
  "timeSignature": string (e.g. "3/4", "4/4"),
  "overallConfidence": number,
  "notes": string (reading caveats, optional),
  "bars": [
    {
      "bar": number,
      "lyrics": string optional,
      "pianoChord": string,
      "function": string optional,
      "confidence": number optional,
      "x": number,
      "y": number,
      "w": number,
      "h": number
    }
  ]
}`;

export const HYMNAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    hymnNumber: { type: "string" },
    key: { type: "string" },
    sharps: { type: "integer" },
    flats: { type: "integer" },
    timeSignature: { type: "string" },
    overallConfidence: { type: "number" },
    bars: {
      type: "array",
      maxItems: 24,
      items: {
        type: "object",
        properties: {
          bar: { type: "integer" },
          pianoChord: { type: "string" },
          x: { type: "integer" },
          y: { type: "integer" },
          w: { type: "integer" },
          h: { type: "integer" },
        },
        required: ["bar", "pianoChord"],
      },
    },
  },
  required: ["key", "timeSignature", "bars"],
} as const;
