"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeHymnal } from "@/lib/analyze";
import { SAMPLE_ANALYSIS } from "@/lib/fixtures/amazing-grace";
import { cropAndCompress, blobToDataUrl, type CropRect } from "@/lib/image";
import { saveChart } from "@/lib/session";
import { CameraCapture } from "./CameraCapture";
import { CropConfirm } from "./CropConfirm";
import { PhoneShell } from "./PhoneShell";

type Step = "home" | "confirm" | "reading" | "error";

const DEFAULT_CROP: CropRect = { x: 0.04, y: 0.06, w: 0.92, h: 0.88 };

export function CaptureFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("home");
  const [photo, setPhoto] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [error, setError] = useState("");

  function onPhoto(dataUrl: string) {
    setPhoto(dataUrl);
    setCrop(DEFAULT_CROP);
    setError("");
    setStep("confirm");
  }

  function onSample() {
    saveChart({ analysis: SAMPLE_ANALYSIS });
    router.push("/chart");
  }

  async function loadSamplePhoto() {
    const res = await fetch("/sample-hymn.jpg");
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    onPhoto(dataUrl);
  }

  async function onRead() {
    if (!photo) return;
    setStep("reading");
    try {
      const blob = await cropAndCompress(photo, crop);
      const analysis = await analyzeHymnal(blob);
      saveChart({ analysis });
      router.push("/chart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t read this page.");
      setStep("error");
    }
  }

  return (
    <PhoneShell>
      {step === "home" && (
        <CameraCapture
          onPhoto={onPhoto}
          onSample={onSample}
          onSamplePhoto={() => void loadSamplePhoto()}
        />
      )}

      {step === "confirm" && photo && (
        <CropConfirm
          photo={photo}
          crop={crop}
          onCrop={setCrop}
          onRead={() => void onRead()}
          onRetake={() => {
            setPhoto(null);
            setStep("home");
          }}
        />
      )}

      {step === "reading" && photo && (
        <Reading photo={photo} />
      )}

      {step === "error" && (
        <ErrorState
          photo={photo}
          message={error}
          onRetry={() => setStep(photo ? "confirm" : "home")}
          onRetake={() => {
            setPhoto(null);
            setStep("home");
          }}
        />
      )}
    </PhoneShell>
  );
}

function Reading({ photo }: { photo: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t safe-x pt-4">
        <p className="text-xs tracking-[0.22em] text-brass uppercase">Reading</p>
        <h1 className="font-display mt-1 text-2xl text-parchment">
          Listening for the harmony…
        </h1>
      </header>
      <div className="safe-x mt-4 flex-1">
        <div className="relative overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="w-full opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-ink/80 px-4 py-2 text-sm text-parchment">
              Bass + melody → guitar chords
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  photo,
  message,
  onRetry,
  onRetake,
}: {
  photo: string | null;
  message: string;
  onRetry: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t safe-x pt-4">
        <p className="text-xs tracking-[0.22em] text-danger uppercase">Couldn’t read</p>
        <h1 className="font-display mt-1 text-2xl text-parchment">Try another shot</h1>
        <p className="mt-2 text-sm leading-5 text-parchment-dim">{message}</p>
      </header>
      {photo && (
        <div className="safe-x mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="w-full rounded-3xl opacity-50" />
        </div>
      )}
      <ul className="safe-x mt-4 space-y-1.5 text-sm text-parchment-dim">
        <li>Fill the frame with one page</li>
        <li>Avoid flash glare</li>
        <li>Crop to the staves</li>
      </ul>
      <div className="safe-x safe-b mt-auto flex flex-col gap-3 pt-8">
        <button
          type="button"
          onClick={onRetry}
          className="h-14 rounded-full bg-parchment text-base font-semibold text-ink"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="h-12 rounded-full border border-ink-line text-sm"
        >
          New photo
        </button>
      </div>
    </div>
  );
}
