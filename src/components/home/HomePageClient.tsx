"use client";

import { useMemo, useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import Link from "next/link";

import { HomeClosingBand } from "@/components/home/HomeClosingBand";
import { HomeCollectionsTeaser } from "@/components/home/HomeCollectionsTeaser";
import { HomeCryptournsExplainer } from "@/components/home/HomeCryptournsExplainer";
import { HomeFeedTeaser } from "@/components/home/HomeFeedTeaser";
import { HomeMintNudge } from "@/components/home/HomeMintNudge";
import { HomeStats } from "@/components/home/HomeStats";
import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  HomeCollectionTeaserRow,
  HomeCollectionsAggregates,
} from "@/lib/collections/homeCollectionsTeaserTypes";
import type { FeedItemPayload } from "@/lib/feed/feedCopy";
import type { HomeStatsSnapshot } from "@/lib/home/getHomeStats";
import { cn } from "@/lib/utils";
import { previewFromTick } from "@/lib/urn/previewFromTick";

export type HomePageClientProps = {
  homeStats: HomeStatsSnapshot;
  feedPreview: FeedItemPayload[];
  collectionsTeaser: {
    rows: HomeCollectionTeaserRow[];
    aggregates: HomeCollectionsAggregates;
  };
};

export function HomePageClient({
  homeStats,
  feedPreview,
  collectionsTeaser,
}: HomePageClientProps) {
  const [previewSeed, setPreviewSeed] = useState(0);
  const preview = useMemo(
    () => previewFromTick(previewSeed, "home"),
    [previewSeed],
  );

  return (
    <main className="relative w-full overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.85]"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[min(520px,70vw)] w-[min(720px,90vw)] rounded-full bg-primary/[0.14] blur-3xl" />
        <div className="absolute top-[28%] -right-1/4 h-[420px] w-[min(640px,85vw)] rounded-full bg-chart-3/[0.11] blur-3xl" />
        <div className="absolute bottom-[5%] left-[15%] h-[320px] w-[55%] rounded-full bg-chart-2/[0.08] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.35_0.08_320_/_0.25),transparent_55%)]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-12">
        <section
          className="grid gap-12 py-16 sm:gap-14 sm:py-20 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,440px)] lg:items-center lg:gap-16 lg:py-24"
          aria-labelledby="home-hero-heading"
        >
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-[0.22em] text-primary/90 uppercase">
                Worthless JPEGs · Pocket dust · Still flexing
              </p>
              <h1
                id="home-hero-heading"
                className="text-4xl leading-[1.06] font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.05] lg:text-[3.35rem] lg:leading-[1.03]"
              >
                <span className="block">
                  Bury the bags{" "}
                  <span className="text-muted-foreground">nobody wants.</span>
                </span>
                <span className="mt-2 block sm:mt-3">
                  Send them to an{" "}
                  <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                    urn
                  </span>
                  —then flex the monument.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                Each Cryptourn is an NFT with its own on-chain account. Dump the
                rugs, the floor JPEGs, the tokens too small to bother selling—
                plus candles if you want drama. The urn is the flex; the chain
                sees what you parked inside.
              </p>
            </div>

            <ul className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {[
                "Ship NFTs & coins into the urn",
                "Light candles on-chain",
                "One token-bound flex piece",
              ].map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-border/80 bg-background/40 px-3 py-1 backdrop-blur-sm"
                >
                  {label}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/mint"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                Mint an urn
              </Link>
              <Link
                href="/urns"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Browse urns
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full gap-2 text-muted-foreground hover:text-foreground sm:w-auto"
                onClick={() => setPreviewSeed((c) => c + 1)}
              >
                <Dices className="size-4 opacity-80" aria-hidden />
                Shuffle preview
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 shrink-0 text-primary/70" aria-hidden />
              <span className="rounded-full border border-border/70 bg-muted/25 px-3 py-1.5 tabular-nums">
                Roman numeral from #{preview.assetCount}
              </span>
              <span className="rounded-full border border-border/70 bg-muted/25 px-3 py-1.5 tabular-nums">
                {preview.candleCount} candles in this roll
              </span>
            </div>
          </div>

          <div className="relative flex flex-col justify-center lg:justify-self-end">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-primary/20 via-chart-4/5 to-transparent opacity-80 blur-2xl"
              aria-hidden
            />
            <div className="relative rounded-3xl border border-border/90 bg-card/25 p-6 shadow-[0_28px_90px_-32px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-[2px] dark:shadow-[0_32px_100px_-28px_rgba(0,0,0,0.75)] dark:ring-white/[0.07] sm:p-8">
              <UrnRenderer
                assetCount={preview.assetCount}
                candleCount={preview.candleCount}
                seed={preview.rendererSeed}
                className="mx-auto w-full max-w-md"
              />
              <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
                Shuffle for a different look. Mint when you&apos;re ready—then
                route your dead assets into the urn and let them live there
                loudly.
              </p>
            </div>
          </div>
        </section>

        <section
          className="border-t border-border/70 py-16 sm:py-20"
          aria-labelledby="home-stats-heading"
        >
          <div className="mb-8 max-w-2xl space-y-2">
            <h2
              id="home-stats-heading"
              className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase"
            >
              Proof on-chain
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Minted urns, assets in vaults, and candles—indexed from the same
              activity you&apos;ll see in the feed and collections.
            </p>
          </div>
          <HomeStats stats={homeStats} />
        </section>

        <HomeCollectionsTeaser
          rows={collectionsTeaser.rows}
          aggregates={collectionsTeaser.aggregates}
        />

        <HomeFeedTeaser items={feedPreview} />

        <HomeMintNudge />
      </div>

      <HomeCryptournsExplainer />

      <HomeClosingBand />
    </main>
  );
}
