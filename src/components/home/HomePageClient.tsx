"use client";

import { useMemo, useState } from "react";

import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { Button } from "@/components/ui/button";
import { previewFromTick } from "@/lib/urn/previewFromTick";

export function HomePageClient() {
  const [previewSeed, setPreviewSeed] = useState(0);
  const preview = useMemo(
    () => previewFromTick(previewSeed, "home"),
    [previewSeed],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-10 lg:px-12">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,440px)]">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Cryptourns
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Randomized on-chain urns with a new preview every re-roll.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Re-generate the homepage urn to shuffle the shape treatment, roman
              numeral inscription, and candle count all at once.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => setPreviewSeed((current) => current + 1)}
            >
              Regenerate Urn
            </Button>
            <a
              href="/mint"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Go to Mint
            </a>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="rounded-full border border-border px-3 py-1.5">
              Roman number from #{preview.assetCount}
            </div>
            <div className="rounded-full border border-border px-3 py-1.5">
              {preview.candleCount} candles
            </div>
          </div>
        </div>

        <UrnRenderer
          assetCount={preview.assetCount}
          candleCount={preview.candleCount}
          seed={preview.rendererSeed}
          className="mx-auto w-full max-w-md"
        />
      </div>
    </main>
  );
}
