export type HymnalBar = {
  bar: number;
  lyrics?: string;
  pianoChord: string;
  guitarChord: string;
  function?: string;
  confidence?: number;
};

export type HymnalAnalysis = {
  title?: string;
  hymnNumber?: string;
  key: string;
  timeSignature: string;
  bars: HymnalBar[];
  notes?: string;
  overallConfidence?: number;
  suggestedCapo?: number;
  suggestedCapoReason?: string;
};

export type ChartPayload = {
  analysis: HymnalAnalysis;
};
