"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { HymnalAnalysis, HymnalBar } from "@/lib/types";
import {
  preferFlatsForKey,
  transposeChord,
  transposeKey,
} from "@/lib/guitar/chords";
import { suggestCapo } from "@/lib/guitar/mapChords";
import { uniqueChordNames } from "@/lib/guitar/voicings";
import { ChordDiagram } from "./ChordDiagram";
import { EditChordSheet } from "./EditChordSheet";
import { PhoneShell } from "./PhoneShell";

type Props = {
  analysis: HymnalAnalysis;
};

type EditTarget = {
  barIndex: number;
  display: string;
};

export function ChordChart({ analysis }: Props) {
  const [bars, setBars] = useState<HymnalBar[]>(analysis.bars);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [edit, setEdit] = useState<EditTarget | null>(null);

  const flats = preferFlatsForKey(transposeKey(analysis.key, transpose));
  const soundingKey = transposeKey(analysis.key, transpose);
  const shift = transpose - capo;

  const displayed = useMemo(
    () =>
      bars.map((bar) => ({
        ...bar,
        displayChord: transposeChord(bar.guitarChord, shift, flats),
      })),
    [bars, shift, flats],
  );

  const liveSuggestion = useMemo(() => {
    const sounding = bars.map((b) => transposeChord(b.guitarChord, transpose, flats));
    return suggestCapo(sounding, soundingKey);
  }, [bars, transpose, flats, soundingKey]);

  const unique = uniqueChordNames(displayed.map((b) => b.displayChord));
  const lowConfidence =
    (analysis.overallConfidence ?? 1) < 0.55 ||
    bars.some((b) => (b.confidence ?? 1) < 0.45);

  function saveEdit(next: string) {
    if (!edit) return;
    const base = transposeChord(next, -shift, preferFlatsForKey(analysis.key));
    setBars((current) =>
      current.map((bar, i) =>
        i === edit.barIndex ? { ...bar, guitarChord: base } : bar,
      ),
    );
    setEdit(null);
  }

  const rows: (typeof displayed)[] = [];
  for (let i = 0; i < displayed.length; i += 4) {
    rows.push(displayed.slice(i, i + 4));
  }

  return (
    <PhoneShell>
      <header className="safe-t safe-x flex items-start justify-between gap-3 pt-4">
        <div>
          <Link href="/" className="text-xs text-brass">
            ← New photo
          </Link>
          <h1 className="font-display mt-2 text-3xl leading-tight text-parchment">
            {analysis.title || "Untitled hymn"}
          </h1>
          <p className="mt-1 text-sm text-parchment-dim">
            {[analysis.hymnNumber ? `#${analysis.hymnNumber}` : null, soundingKey, analysis.timeSignature]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>
      </header>

      {lowConfidence && (
        <div className="safe-x mt-4">
          <p className="rounded-2xl border border-brass/40 bg-ink-raised px-4 py-3 text-sm text-brass-bright">
            Check these — the page was hard to read. Tap any chord to fix it.
          </p>
        </div>
      )}

      {analysis.notes && (
        <p className="safe-x mt-3 text-xs text-parchment-dim">{analysis.notes}</p>
      )}

      <section className="safe-x mt-5 rounded-2xl border border-ink-line bg-ink-raised p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-[0.18em] text-brass uppercase">Transpose</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-ink-line text-lg"
              onClick={() => setTranspose((n) => Math.max(-5, n - 1))}
            >
              −
            </button>
            <span className="w-8 text-center font-medium">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-ink-line text-lg"
              onClick={() => setTranspose((n) => Math.min(6, n + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs tracking-[0.18em] text-brass uppercase">Capo</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-ink-line text-lg"
              onClick={() => setCapo((n) => Math.max(0, n - 1))}
            >
              −
            </button>
            <span className="w-8 text-center font-medium">{capo}</span>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-ink-line text-lg"
              onClick={() => setCapo((n) => Math.min(7, n + 1))}
            >
              +
            </button>
          </div>
        </div>
        {liveSuggestion.capo > 0 && capo !== liveSuggestion.capo && (
          <button
            type="button"
            onClick={() => setCapo(liveSuggestion.capo)}
            className="mt-4 w-full rounded-xl border border-brass/50 px-3 py-2 text-left text-sm text-brass-bright"
          >
            {liveSuggestion.reason}
          </button>
        )}
        {capo > 0 && (
          <p className="mt-3 text-xs text-parchment-dim">
            Sounding {soundingKey}. Play the shapes below with capo {capo}.
          </p>
        )}
      </section>

      <section className="safe-x mt-6">
        <p className="text-xs tracking-[0.18em] text-brass uppercase">Progression</p>
        <div className="mt-3 space-y-4">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-2">
              {row.map((bar) => (
                <button
                  key={bar.bar}
                  type="button"
                  onClick={() =>
                    setEdit({ barIndex: bars.findIndex((b) => b.bar === bar.bar), display: bar.displayChord })
                  }
                  className="rounded-xl bg-ink-raised px-1.5 py-2 text-left"
                >
                  <p className="font-display text-xl leading-none text-parchment">
                    {bar.displayChord}
                  </p>
                  {bar.lyrics ? (
                    <p className="mt-1 truncate text-[10px] leading-tight text-parchment-dim">
                      {bar.lyrics}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-ink-line">{bar.bar}</p>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-parchment-dim">Tap a chord to edit it.</p>
      </section>

      <section className="safe-x safe-b mt-8 pb-6">
        <p className="text-xs tracking-[0.18em] text-brass uppercase">Shapes</p>
        <div className="mt-4 flex flex-wrap justify-between gap-y-6">
          {unique.map((name) => (
            <ChordDiagram key={name} name={name} className="w-[30%]" />
          ))}
        </div>
      </section>

      {edit && (
        <EditChordSheet
          value={edit.display}
          onSave={saveEdit}
          onClose={() => setEdit(null)}
        />
      )}
    </PhoneShell>
  );
}
