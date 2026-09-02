"use client";

import { useRef } from "react";

const QUICK = [
  "C",
  "G",
  "D",
  "Em",
  "Am",
  "F",
  "E",
  "A",
  "Dm",
  "B7",
  "G7",
  "C7",
  "D7",
  "A7",
  "G/B",
  "D/F#",
  "C/E",
  "Eb",
  "Bb",
  "Ab",
  "N.C.",
];

type Props = {
  value: string;
  onSave: (chord: string) => void;
  onClose: () => void;
};

export function EditChordSheet({ value, onSave, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] rounded-t-3xl border border-ink-line bg-ink-raised p-5 pb-8">
        <p className="text-xs tracking-[0.2em] text-brass uppercase">Edit chord</p>
        <input
          ref={inputRef}
          autoFocus
          defaultValue={value}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(e.currentTarget.value.trim() || value);
            }
            if (e.key === "Escape") onClose();
          }}
          className="font-display mt-3 h-12 w-full rounded-xl border border-ink-line bg-ink px-3 text-2xl text-parchment outline-none focus:border-brass"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((chord) => (
            <button
              key={chord}
              type="button"
              onClick={() => onSave(chord)}
              className="rounded-full border border-ink-line px-3 py-1.5 text-sm text-parchment"
            >
              {chord}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-ink-line text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(inputRef.current?.value.trim() || value)}
            className="h-11 flex-1 rounded-full bg-parchment text-sm font-semibold text-ink"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
