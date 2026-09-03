"use client";

import { splitBarChords } from "@/lib/guitar/chords";
import type { HymnalBar } from "@/lib/types";

type DisplayBar = HymnalBar & { displayChord: string };

type Props = {
  image: string;
  bars: DisplayBar[];
  onEdit: (barIndex: number, display: string) => void;
};

export function ScoreOverlay({ image, bars, onEdit }: Props) {
  return (
    <div className="rounded-2xl bg-[#f3e6c9] pt-8">
      <div className="relative overflow-visible">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Hymnal page" className="block w-full" />
        {bars.flatMap((bar, barIndex) => {
          if (bar.x == null || bar.y == null || bar.w == null || bar.h == null) {
            return [];
          }
          const x = bar.x;
          const y = bar.y;
          const w = bar.w;
          const h = bar.h;
          const chords = splitBarChords(bar.displayChord);
          return chords.flatMap((chord, chordIndex) => {
            const left = x + (chordIndex / Math.max(chords.length, 1)) * w;
            const staffTop = Math.max(0, y - h * 0.06);
            return [
              <button
                key={`${bar.bar}-${chordIndex}`}
                type="button"
                onClick={() => onEdit(barIndex, bar.displayChord)}
                className="font-display absolute z-10 rounded bg-ink px-1.5 py-0.5 text-[12px] font-semibold leading-none text-parchment shadow-sm"
                style={{
                  left: `${left * 100}%`,
                  top: `${staffTop * 100}%`,
                  transform: "translateY(calc(-100% - 12px))",
                }}
              >
                {chord}
              </button>,
            ];
          });
        })}
      </div>
    </div>
  );
}
