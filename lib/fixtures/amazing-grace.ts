import type { HymnalAnalysis } from "../types";
import { mapAnalysis } from "../guitar/mapChords";

const raw: HymnalAnalysis = {
  title: "Amazing Grace",
  hymnNumber: "45",
  key: "Eb",
  timeSignature: "3/4",
  overallConfidence: 0.9,
  notes: "Sample hymn in E-flat — try the suggested capo.",
  bars: [
    { bar: 1, lyrics: "Amazing grace", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.95 },
    { bar: 2, lyrics: "how sweet", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.95 },
    { bar: 3, lyrics: "the sound", pianoChord: "Ab", guitarChord: "Ab", function: "IV", confidence: 0.9 },
    { bar: 4, lyrics: "that saved", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.95 },
    { bar: 5, lyrics: "a wretch", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.9 },
    { bar: 6, lyrics: "like me", pianoChord: "Bb", guitarChord: "Bb", function: "V", confidence: 0.93 },
    { bar: 7, lyrics: "I once", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.9 },
    { bar: 8, lyrics: "was lost", pianoChord: "Eb/G", guitarChord: "Eb/G", function: "I6", confidence: 0.85 },
    { bar: 9, lyrics: "but now", pianoChord: "Ab", guitarChord: "Ab", function: "IV", confidence: 0.9 },
    { bar: 10, lyrics: "am found", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.95 },
    { bar: 11, lyrics: "was blind", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.9 },
    { bar: 12, lyrics: "but now", pianoChord: "Bb7", guitarChord: "Bb7", function: "V7", confidence: 0.93 },
    { bar: 13, lyrics: "I see", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.95 },
    { bar: 14, lyrics: "", pianoChord: "Eb", guitarChord: "Eb", function: "I", confidence: 0.9 },
  ],
};

export const SAMPLE_ANALYSIS = mapAnalysis(raw);
