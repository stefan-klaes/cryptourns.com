"use client";

import { useId, useMemo } from "react";
import { generateUrnSvgString } from "@/lib/urn/generateUrnSvgString";
import { cn } from "@/lib/utils";

interface UrnRendererProps {
  assetCount: number;
  candleCount: number;
  className?: string;
  seed?: string | number;
}

export function UrnRenderer({
  assetCount,
  candleCount,
  className,
  seed,
}: UrnRendererProps) {
  const seedId = useId();
  const resolvedSeed = seed ?? seedId;

  const svgContent = useMemo(
    () =>
      generateUrnSvgString({
        assetCount,
        candleCount,
        seed: resolvedSeed,
      }),
    [assetCount, candleCount, resolvedSeed],
  );

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
