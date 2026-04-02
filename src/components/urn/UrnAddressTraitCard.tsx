"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type UrnAddressTraitCardProps = {
  label: string;
  displayShort: string;
  fullAddress: string;
};

export function UrnAddressTraitCard({
  label,
  displayShort,
  fullAddress,
}: UrnAddressTraitCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="relative flex h-full flex-col rounded-xl border border-border bg-card/80 px-4 py-3 pr-11 shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
      title={displayShort !== fullAddress ? fullAddress : undefined}
    >
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="absolute right-2 top-2 rounded-md p-1.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Copy urn address"
      >
        {copied ? (
          <Check className="size-4 text-foreground" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </button>
      <span className="text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="mt-1 font-mono text-sm font-medium break-all text-foreground sm:text-base">
        {displayShort}
      </span>
    </div>
  );
}
