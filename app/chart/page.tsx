"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ChordChart } from "@/components/ChordChart";
import { PhoneShell } from "@/components/PhoneShell";
import { loadChart } from "@/lib/session";
import type { ChartPayload } from "@/lib/types";

function subscribe() {
  return () => {};
}

function getSnapshot(): ChartPayload | null {
  return loadChart();
}

function getServerSnapshot(): ChartPayload | null {
  return null;
}

export default function ChartPage() {
  const payload = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!payload) {
    return (
      <PhoneShell>
        <div className="safe-t safe-x flex min-h-dvh flex-col pt-10">
          <p className="text-xs tracking-[0.22em] text-brass uppercase">Chart</p>
          <h1 className="font-display mt-2 text-3xl text-parchment">No hymn yet</h1>
          <p className="mt-2 text-sm text-parchment-dim">
            Photograph a hymnal page, or try the sample hymn.
          </p>
          <Link
            href="/"
            className="mt-8 flex h-14 items-center justify-center rounded-full bg-parchment text-base font-semibold text-ink"
          >
            Go to camera
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return <ChordChart analysis={payload.analysis} />;
}
