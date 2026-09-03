"use client";

import { useEffect, useRef, useState } from "react";
import { captureVideoFrame, fileToDataUrl } from "@/lib/image";

type Props = {
  onPhoto: (dataUrl: string) => void;
  onSample: () => void;
  onSamplePhoto: () => void;
};

function isPhone() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

function cameraAttempts(): MediaTrackConstraints[] {
  if (isPhone()) {
    return [
      { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      { facingMode: "environment" },
      { width: { ideal: 1920 } },
    ];
  }
  return [
    { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
    { width: { ideal: 1920 }, height: { ideal: 1080 } },
    { facingMode: "user" },
  ];
}

export function CameraCapture({ onPhoto, onSample, onSamplePhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    setDesktop(!isPhone());
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser has no webcam API. Choose a photo instead.");
        return;
      }

      let lastError = "Camera needs permission.";
      for (const video of cameraAttempts()) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
          break;
        } catch (error) {
          lastError =
            error instanceof Error ? error.message : "Camera needs permission.";
        }
      }

      if (!stream) {
        setCameraError(
          desktopHint(lastError),
        );
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
        setLive(true);
        setCameraError("");
      } catch {
        setCameraError("Could not start the webcam preview. Click Photograph to try again.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
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
        <p className="mt-2 max-w-[22rem] text-sm leading-5 text-parchment-dim">
          {desktop
            ? "Hold one hymnal page up to the webcam until the staves fill the frame. Then snap."
            : "Photograph a hymnal page. We’ll read the piano harmony and show guitar chords."}
        </p>
      </header>

      <div className="safe-x flex-1">
        <div
          className={`relative overflow-hidden rounded-3xl border border-ink-line bg-ink-raised ${
            desktop ? "aspect-video" : "aspect-[3/4]"
          }`}
        >
          <video
            ref={videoRef}
            className={`h-full w-full object-contain ${live ? "opacity-100" : "opacity-0"}`}
            playsInline
            muted
            autoPlay
          />
          {!live && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <StaffMark />
              <p className="text-sm text-parchment-dim">
                {desktop
                  ? "Allow the camera, then hold the page steady."
                  : "Fill the frame with one page. Avoid flash glare."}
              </p>
              {cameraError ? (
                <p className="text-xs text-brass">{cameraError}</p>
              ) : (
                <p className="text-xs text-parchment-dim/80">Starting camera…</p>
              )}
            </div>
          )}
          {live && (
            <p className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] text-parchment">
              Webcam live
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-parchment-dim">
          <li>One page, staves filling the frame</li>
          <li>{desktop ? "Use room light — turn the page toward the webcam" : "No flash — glare hides the notes"}</li>
          <li>Crop to the music if the margins are large</li>
        </ul>
      </div>

      <div className="safe-x safe-b mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={shutter}
          className="h-14 rounded-full bg-parchment text-base font-semibold text-ink"
        >
          {live ? "Snap webcam photo" : "Photograph hymnal"}
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

function desktopHint(message: string) {
  if (/permission|denied|notallowed/i.test(message)) {
    return "Allow the webcam for localhost, then refresh. Or choose a photo.";
  }
  if (/notfound|device/i.test(message)) {
    return "No webcam found. Plug one in, or choose a photo.";
  }
  return "Camera needs permission — or use Choose from library.";
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
