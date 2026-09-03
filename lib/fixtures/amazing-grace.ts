import type { HymnalAnalysis } from "../types";
import { mapAnalysis } from "../guitar/mapChords";

const sampleBoxes = [
  { x: 0.078, y: 0.15, w: 0.27, h: 0.105 },
  { x: 0.359, y: 0.15, w: 0.27, h: 0.105 },
  { x: 0.64, y: 0.15, w: 0.27, h: 0.105 },
  { x: 0.078, y: 0.358, w: 0.27, h: 0.105 },
  { x: 0.359, y: 0.358, w: 0.27, h: 0.105 },
  { x: 0.64, y: 0.358, w: 0.27, h: 0.105 },
  { x: 0.078, y: 0.567, w: 0.27, h: 0.105 },
  { x: 0.359, y: 0.567, w: 0.27, h: 0.105 },
  { x: 0.64, y: 0.567, w: 0.27, h: 0.105 },
  { x: 0.078, y: 0.775, w: 0.27, h: 0.105 },
  { x: 0.359, y: 0.775, w: 0.27, h: 0.105 },
  { x: 0.64, y: 0.775, w: 0.27, h: 0.105 },
];

const raw: HymnalAnalysis = {
  title: "Amazing Grace",
  hymnNumber: "45",
  key: "Eb",
  flats: 3,
  timeSignature: "3/4",
  overallConfidence: 0.9,
  notes: "Sample hymn in E-flat — try the suggested capo.",
  bars: [
    { bar: 1, lyrics: "Amazing grace", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[0] },
    { bar: 2, lyrics: "how sweet", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[1] },
    { bar: 3, lyrics: "the sound", pianoChord: "Ab", guitarChord: "Ab", function: "IV", ...sampleBoxes[2] },
    { bar: 4, lyrics: "that saved", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[3] },
    { bar: 5, lyrics: "a wretch", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[4] },
    { bar: 6, lyrics: "like me", pianoChord: "Bb", guitarChord: "Bb", function: "V", ...sampleBoxes[5] },
    { bar: 7, lyrics: "I once", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[6] },
    { bar: 8, lyrics: "was lost", pianoChord: "Eb/G", guitarChord: "Eb/G", function: "I6", ...sampleBoxes[7] },
    { bar: 9, lyrics: "but now", pianoChord: "Ab", guitarChord: "Ab", function: "IV", ...sampleBoxes[8] },
    { bar: 10, lyrics: "am found", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[9] },
    { bar: 11, lyrics: "was blind", pianoChord: "Eb", guitarChord: "Eb", function: "I", ...sampleBoxes[10] },
    { bar: 12, lyrics: "I see", pianoChord: "Bb7 Eb", guitarChord: "Bb7 Eb", function: "V7 I", ...sampleBoxes[11] },
  ],
};

export const SAMPLE_ANALYSIS = mapAnalysis(raw);
export const SAMPLE_IMAGE = "/sample-hymn.jpg";
