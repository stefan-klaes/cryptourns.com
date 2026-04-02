import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type UrnsPageHeaderProps = {
  totalIndexed: number;
  totalOnChain: number;
  assetUnits: number;
  candles: number;
};

function Em({ children }: { children: ReactNode }) {
  return <span className="font-semibold tabular-nums text-foreground">{children}</span>;
}

export function UrnsPageHeader({
  totalIndexed,
  totalOnChain,
  assetUnits,
  candles,
}: UrnsPageHeaderProps) {
  const supplyKnown = totalOnChain > 0;
  const inSync = supplyKnown && totalIndexed === totalOnChain;

  const summary = (() => {
    if (totalIndexed === 0) {
      return (
        <>
          No Cryptourns in the index yet—open an urn or run a sync, then
          you&apos;ll see live totals here.
        </>
      );
    }

    if (supplyKnown) {
      if (inSync) {
        return (
          <>
            <Em>{totalOnChain.toLocaleString()}</Em>{" "}
            {totalOnChain === 1 ? "Cryptourn exists" : "Cryptourns exist"}{" "}
            on-chain, with <Em>{assetUnits.toLocaleString()}</Em>{" "}
            {assetUnits === 1 ? "asset" : "assets"} indexed across their vaults
            {candles > 0 ? (
              <>
                {" "}
                and <Em>{candles.toLocaleString()}</Em>{" "}
                {candles === 1 ? "candle" : "candles"} lit
              </>
            ) : null}
            .
          </>
        );
      }
      return (
        <>
          <Em>{totalOnChain.toLocaleString()}</Em>{" "}
          {totalOnChain === 1 ? "Cryptourn exists" : "Cryptourns exist"}{" "}
          on-chain. This gallery lists <Em>{totalIndexed.toLocaleString()}</Em>{" "}
          of them, holding <Em>{assetUnits.toLocaleString()}</Em>{" "}
          {assetUnits === 1 ? "asset" : "assets"}
          {candles > 0 ? (
            <>
              {" "}
              and <Em>{candles.toLocaleString()}</Em>{" "}
              {candles === 1 ? "candle" : "candles"}
            </>
          ) : null}{" "}
          in the index.
        </>
      );
    }

    return (
      <>
        The index tracks <Em>{totalIndexed.toLocaleString()}</Em>{" "}
        {totalIndexed === 1 ? "Cryptourn" : "Cryptourns"} with{" "}
        <Em>{assetUnits.toLocaleString()}</Em>{" "}
        {assetUnits === 1 ? "asset" : "assets"}
        {candles > 0 ? (
          <>
            {" "}
            and <Em>{candles.toLocaleString()}</Em>{" "}
            {candles === 1 ? "candle" : "candles"}
          </>
        ) : null}{" "}
        recorded so far.
      </>
    );
  })();

  return (
    <header className="mb-10">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm sm:p-8",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent",
        )}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-xs font-medium tracking-[0.22em] text-primary/90 uppercase">
              Browse
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
              Urns
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
              Each Cryptourn is an NFT with its own on-chain account. This grid
              is the browsable slice of what we&apos;ve indexed—vault contents,
              candles, and cracks.
            </p>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {summary}
            </p>
          </div>

          <Link
            href={"/mint" as Route}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center self-start rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors",
              "hover:bg-primary/90",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          >
            Mint an urn
          </Link>
        </div>
      </div>
    </header>
  );
}
