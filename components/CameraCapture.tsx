"use client";

import { useEffect, useRef, useState } from "react";
import { captureVideoFrame, fileToDataUrl } from "@/lib/image";

type Props = {
  onPhoto: (dataUrl: string) => void;
  onSample: () => void;
  onSamplePhoto: () => void;
};

export function CameraCapture({ onPhoto, onSample, onSamplePhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setLive(true);
        }
      } catch {
        setCameraError("Camera needs permission — or use the buttons below.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    onPhoto(await fileToDataUrl(file));
  }

  function shutter() {
    const video = videoRef.current;
    if (live && video && video.videoWidth > 0) {
      onPhoto(captureVideoFrame(video));
      return;
    }
    captureInput.current?.click();
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="safe-t safe-x pb-3 pt-4">
        <p className="text-xs tracking-[0.22em] text-brass uppercase">Chordify</p>
        <h1 className="font-display mt-1 text-3xl font-semibold text-parchment">
          Hymnal → Guitar
        </h1>
        <p className="mt-2 max-w-[20rem] text-sm leading-5 text-parchment-dim">
          Photograph a hymnal page. We’ll read the piano harmony and show guitar chords.
        </p>
      </header>

      <div className="safe-x flex-1">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-ink-line bg-ink-raised">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${live ? "opacity-100" : "opacity-0"}`}
            playsInline
            muted
            autoPlay
          />
          {!live && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <StaffMark />
              <p className="text-sm text-parchment-dim">
                Fill the frame with one page. Avoid flash glare.
              </p>
              {cameraError ? (
                <p className="text-xs text-brass">{cameraError}</p>
              ) : (
                <p className="text-xs text-parchment-dim/80">Starting camera…</p>
              )}
            </div>
          )}
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-parchment-dim">
          <li>One page, staves filling the frame</li>
          <li>No flash — glare hides the notes</li>
          <li>Crop to the music if the margins are large</li>
        </ul>
      </div>

      <div className="safe-x safe-b mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={shutter}
          className="h-14 rounded-full bg-parchment text-base font-semibold text-ink"
        >
          Photograph hymnal
        </button>
        <button
          type="button"
          onClick={() => libraryInput.current?.click()}
          className="h-12 rounded-full border border-ink-line text-sm text-parchment"
        >
          Choose from library
        </button>
        <button
          type="button"
          onClick={onSamplePhoto}
          className="h-12 rounded-full border border-ink-line text-sm text-parchment"
        >
          Use sample page photo
        </button>
        <button
          type="button"
          onClick={onSample}
          className="h-10 text-sm text-brass"
        >
          Try a sample hymn
        </button>
      </div>

      <input
        ref={captureInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}

function StaffMark() {
  return (
    <div className="flex h-16 w-28 flex-col justify-between py-1 opacity-70">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="block h-px bg-brass" />
      ))}
    </div>
  );
}
