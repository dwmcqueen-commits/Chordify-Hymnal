export type BarBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type HymnalBar = {
  bar: number;
  lyrics?: string;
  pianoChord: string;
  guitarChord: string;
  function?: string;
  confidence?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type HymnalAnalysis = {
  title?: string;
  hymnNumber?: string;
  key: string;
  sharps?: number;
  flats?: number;
  timeSignature: string;
  bars: HymnalBar[];
  notes?: string;
  overallConfidence?: number;
  suggestedCapo?: number;
  suggestedCapoReason?: string;
};

export type ChartPayload = {
  analysis: HymnalAnalysis;
  image?: string;
};
