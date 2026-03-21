"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { EthereumLogo } from "@/components/brand-icons";
import { cn } from "@/lib/utils";

export function WalletStatusIcon({
  className,
  iconClassName,
  size = "md",
}: {
  className?: string;
  iconClassName?: string;
  size?: "md" | "sm";
}) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const connected = mounted && isConnected;
  const sm = size === "sm";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        sm ? "size-4" : "size-6",
        className,
      )}
    >
      <EthereumLogo
        className={cn(
          "fill-current",
          sm ? "size-4" : "size-6",
          iconClassName,
        )}
        aria-hidden
      />
      <span
        className={cn(
          "pointer-events-none absolute rounded-full border-background",
          sm
            ? "-right-px -top-px size-2 border"
            : "-right-0.5 -top-0.5 size-2.5 border-2",
          connected ? "bg-green-500" : "bg-red-500",
        )}
        aria-hidden
      />
    </span>
  );
}
