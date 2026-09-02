"use client";

import { voicingFor, type Fret } from "@/lib/guitar/voicings";

type Props = {
  name: string;
  className?: string;
};

export function ChordDiagram({ name, className = "" }: Props) {
  const voicing = voicingFor(name);
  if (!voicing) {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        <p className="font-display text-lg text-parchment">{name}</p>
        <p className="text-[10px] text-parchment-dim">No diagram</p>
      </div>
    );
  }

  const stringCount = 6;
  const fretCount = 5;
  const padX = 18;
  const padY = 22;
  const stringGap = 14;
  const fretGap = 16;
  const width = padX * 2 + stringGap * (stringCount - 1);
  const height = padY + 10 + fretGap * fretCount;
  const nut = voicing.baseFret <= 1;
  const barreFret = detectBarre(voicing.frets);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <p className="font-display mb-1 text-lg leading-none text-parchment">{name}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden="true"
      >
        {voicing.frets.map((fret, i) => {
          const x = padX + i * stringGap;
          const muted = fret === "x";
          const open = fret === 0;
          return (
            <text
              key={`mark-${i}`}
              x={x}
              y={12}
              textAnchor="middle"
              fill={muted ? "#cbb892" : "#f3e6c9"}
              fontSize="10"
            >
              {muted ? "×" : open ? "○" : ""}
            </text>
          );
        })}

        {nut && (
          <rect
            x={padX - 1}
            y={padY}
            width={stringGap * (stringCount - 1) + 2}
            height={3}
            fill="#f3e6c9"
          />
        )}

        {!nut && (
          <text
            x={4}
            y={padY + fretGap * 0.7}
            fill="#cbb892"
            fontSize="9"
          >
            {voicing.baseFret}
          </text>
        )}

        {Array.from({ length: fretCount + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padX}
            x2={padX + stringGap * (stringCount - 1)}
            y1={padY + i * fretGap}
            y2={padY + i * fretGap}
            stroke="#3a332c"
            strokeWidth={i === 0 && nut ? 0 : 1.2}
          />
        ))}

        {Array.from({ length: stringCount }).map((_, i) => (
          <line
            key={`str-${i}`}
            x1={padX + i * stringGap}
            x2={padX + i * stringGap}
            y1={padY}
            y2={padY + fretGap * fretCount}
            stroke="#cbb892"
            strokeWidth={1}
          />
        ))}

        {barreFret !== null && (
          <rect
            x={padX - 6}
            y={padY + (barreFret - voicing.baseFret) * fretGap + fretGap / 2 - 5}
            width={stringGap * (stringCount - 1) + 12}
            height={10}
            rx={5}
            fill="#f3e6c9"
            opacity={0.95}
          />
        )}

        {voicing.frets.map((fret, i) => {
          if (fret === "x" || fret === 0) return null;
          const displayFret = fret - voicing.baseFret + 1;
          if (displayFret < 1 || displayFret > fretCount) return null;
          if (barreFret !== null && fret === barreFret) return null;
          const x = padX + i * stringGap;
          const y = padY + (displayFret - 0.5) * fretGap;
          return <circle key={`dot-${i}`} cx={x} cy={y} r={5} fill="#f3e6c9" />;
        })}
      </svg>
    </div>
  );
}

function detectBarre(frets: Fret[]): number | null {
  const first = frets[0];
  const last = frets[5];
  if (typeof first !== "number" || first <= 0) return null;
  if (last !== first) return null;
  const count = frets.filter((f) => f === first).length;
  return count >= 4 ? first : null;
}
