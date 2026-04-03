"use client";

import Link from "next/link";

import { CryptournLogo } from "@/components/CryptournLogo";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden",
      )}
    >
      <div className="mx-auto flex h-10 max-w-6xl items-center justify-between gap-2 px-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-1.5 text-foreground transition-opacity hover:opacity-90"
        >
          <CryptournLogo className="size-[1.125rem] shrink-0" />
          <span className="truncate text-xs font-semibold tracking-tight lowercase">
            cryptourns
          </span>
        </Link>
        <WalletConnectButton variant="mobileHeader" />
      </div>
    </header>
  );
}
