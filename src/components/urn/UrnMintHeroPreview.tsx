"use client";

import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { UrnMintLifecycleExplainer } from "@/components/urn/UrnMintLifecycleExplainer";
import { cn } from "@/lib/utils";

export type UrnMintHeroPreviewProps = {
  className?: string;
  emptySeed?: string | number;
  variant?: "compact" | "featured";
};

export function UrnMintHeroPreview({
  className,
  emptySeed,
  variant = "compact",
}: UrnMintHeroPreviewProps) {
  const featured = variant === "featured";

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div
        className={cn(
          "relative w-full",
          featured && "mx-auto max-w-md sm:max-w-lg",
        )}
      >
        <UrnRenderer
          assetCount={0}
          candleCount={0}
          seed={emptySeed}
          className="w-full"
        />
      </div>
      <div
        className={cn(
          featured
            ? "rounded-2xl border border-border/80 bg-card/40 p-5 sm:p-6"
            : "rounded-xl border border-border/80 bg-muted/25 px-4 py-3.5 sm:px-5 sm:py-4",
        )}
      >
        <UrnMintLifecycleExplainer variant={variant} />
      </div>
    </div>
  );
}
