# Chordify Hymnal

Photograph a hymnal page on your phone. The app reads the piano / SATB harmony and shows guitar chords, diagrams, transpose, and capo.

## Run it

1. Copy `.env.example` to `.env.local` and add a `GEMINI_API_KEY` (or `OPENAI_API_KEY`).
2. Install and start:

```bash
npm install
npm run dev
```

3. On your phone, open the printed local URL (same Wi-Fi). On a computer, use **Try a sample hymn** to see the chart without a camera.

Chrome/Safari can add it to the home screen (standalone PWA). Photos are sent to the vision API, then discarded — nothing is saved.

## How to shoot

- One hymnal page, staves filling the frame
- No flash (glare hides notes)
- Crop to the music before **Read chords**

## Stack

Next.js, Tailwind, Gemini (OpenAI vision as fallback), and a local piano-to-guitar mapper.
