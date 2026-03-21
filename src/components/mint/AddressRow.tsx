"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/utils/shortenAddress";

type AddressRowProps = {
  address: string;
  isYou?: boolean;
  onRemove?: () => void;
};

export function AddressRow({ address, isYou, onRemove }: AddressRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
        {shortenAddress(address)}
      </span>
      {isYou && (
        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          you
        </span>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Remove address"
          onClick={onRemove}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
