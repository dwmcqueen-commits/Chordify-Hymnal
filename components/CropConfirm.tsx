"use client";

import { useRef, useState } from "react";
import type { CropRect } from "@/lib/image";

type Handle = "nw" | "ne" | "sw" | "se" | "move";

type Props = {
  photo: string;
  crop: CropRect;
  onCrop: (crop: CropRect) => void;
  onRead: () => void;
  onRetake: () => void;
};

function clampCrop(next: CropRect): CropRect {
  const w = Math.min(1, Math.max(0.2, next.w));
  const h = Math.min(1, Math.max(0.2, next.h));
  const x = Math.min(1 - w, Math.max(0, next.x));
  const y = Math.min(1 - h, Math.max(0, next.y));
  return { x, y, w, h };
}

export function CropConfirm({ photo, crop, onCrop, onRead, onRetake }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    start: CropRect;
  } | null>(null);
  const [active, setActive] = useState(false);

  function onPointerDown(handle: Handle, e: React.PointerEvent) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      start: crop,
    };
    setActive(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / r.width;
    const dy = (e.clientY - d.startY) / r.height;
    const s = d.start;
    let next = { ...s };

    if (d.handle === "move") {
      next = { ...s, x: s.x + dx, y: s.y + dy };
    } else {
      if (d.handle.includes("w")) {
        next.x = s.x + dx;
        next.w = s.w - dx;
      }
      if (d.handle.includes("e")) {
        next.w = s.w + dx;
      }
      if (d.handle.includes("n")) {
        next.y = s.y + dy;
        next.h = s.h - dy;
      }
      if (d.handle.includes("s")) {
        next.h = s.h + dy;
      }
    }
    onCrop(clampCrop(next));
  }

  function onPointerUp() {
    drag.current = null;
    setActive(false);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t safe-x pb-3 pt-4">
        <p className="text-xs tracking-[0.22em] text-brass uppercase">Confirm</p>
        <h1 className="font-display mt-1 text-2xl text-parchment">Crop to the staves</h1>
      </header>

      <div className="safe-x flex-1">
        <div className="flex max-h-[58dvh] justify-center">
        <div
          ref={frameRef}
          className="relative inline-block max-h-[58dvh] max-w-full overflow-hidden rounded-3xl bg-black"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Hymnal page"
            className="block max-h-[58dvh] w-auto max-w-full"
          />
          <div className="pointer-events-none absolute inset-0">
            <div
              className={`absolute border-2 ${active ? "border-brass-bright" : "border-parchment"}`}
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Move crop"
            className="absolute cursor-move"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
            onPointerDown={(e) => onPointerDown("move", e)}
          />
          {(["nw", "ne", "sw", "se"] as Handle[]).map((handle) => (
            <button
              key={handle}
              type="button"
              aria-label={`${handle} handle`}
              className="absolute z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-parchment"
              style={{
                left: `${(handle.includes("w") ? crop.x : crop.x + crop.w) * 100}%`,
                top: `${(handle.includes("n") ? crop.y : crop.y + crop.h) * 100}%`,
              }}
              onPointerDown={(e) => onPointerDown(handle, e)}
            />
          ))}
        </div>
        </div>
        <p className="mt-3 text-xs text-parchment-dim">
          Drag the box so it covers the music. Margins and facing pages can confuse the reader.
        </p>
      </div>

      <div className="safe-x safe-b mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onRead}
          className="h-14 rounded-full bg-parchment text-base font-semibold text-ink"
        >
          Read chords
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="h-12 rounded-full border border-ink-line text-sm text-parchment"
        >
          Retake
        </button>
      </div>
    </div>
  );
}
