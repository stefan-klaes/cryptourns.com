"use client";

import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { cn } from "@/lib/utils";

export type HomeExplainerVisualVariant =
  | "intro"
  | "palette"
  | "candles"
  | "cracked"
  | "closure";

type HomeExplainerVisualProps = {
  variant: HomeExplainerVisualVariant;
  className?: string;
};

function CrackOverlay({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-foreground/35",
        className,
      )}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.35}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M8 12 L42 38 L28 52 L55 78 L88 62" opacity={0.9} />
      <path d="M92 18 L68 44 L78 58 L48 88" opacity={0.75} />
      <path d="M22 88 L38 62 L18 48 L32 22" opacity={0.6} />
      <path d="M52 8 L58 32 L44 28 L50 18" opacity={0.55} />
    </svg>
  );
}

export function HomeExplainerVisual({
  variant,
  className,
}: HomeExplainerVisualProps) {
  if (variant === "intro") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-3 sm:gap-4",
          className,
        )}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <UrnRenderer
            key={i}
            assetCount={0}
            candleCount={0}
            seed={`explainer-wallet-${i}`}
            className="max-w-[min(42vw,9.5rem)] shrink-0 sm:max-w-[10.5rem]"
          />
        ))}
      </div>
    );
  }

  if (variant === "palette") {
    return (
      <div className={cn("mx-auto w-full max-w-sm sm:max-w-md", className)} aria-hidden>
        <UrnRenderer
          assetCount={64}
          candleCount={0}
          seed="explainer-palette"
          className="w-full"
        />
      </div>
    );
  }

  if (variant === "candles") {
    return (
      <div
        className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)}
        aria-hidden
      >
        <UrnRenderer
          assetCount={24}
          candleCount={2}
          seed="explainer-their-urn"
          className="w-full"
        />
        <UrnRenderer
          assetCount={18}
          candleCount={9}
          seed="explainer-after-candles"
          className="w-full"
        />
      </div>
    );
  }

  if (variant === "cracked") {
    return (
      <div
        className={cn("relative mx-auto w-full max-w-sm sm:max-w-md", className)}
        aria-hidden
      >
        <div className="relative">
          <UrnRenderer
            assetCount={48}
            candleCount={2}
            seed="explainer-cracked-urn"
            className="w-full"
          />
          <CrackOverlay />
          <span className="absolute top-2 right-2 rounded-full bg-destructive/90 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-destructive-foreground uppercase backdrop-blur-sm">
            Cracked
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm sm:max-w-md", className)} aria-hidden>
      <UrnRenderer
        assetCount={120}
        candleCount={4}
        seed="explainer-monument"
        className="w-full"
      />
    </div>
  );
}
