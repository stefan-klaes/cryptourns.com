"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

import { WalletDetailSheet } from "@/components/WalletDetailSheet";
import { WalletStatusIcon } from "@/components/WalletStatusIcon";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/utils/shortenAddress";

type WalletConnectButtonProps = {
  variant?: "desktop" | "mobileHeader";
};

export function WalletConnectButton({
  variant = "desktop",
}: WalletConnectButtonProps) {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, mounted, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account;

        return (
          <>
            <button
              type="button"
              disabled={!ready}
              onClick={() =>
                connected ? setAccountOpen(true) : openConnectModal()
              }
              className={cn(
                "cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                variant === "mobileHeader" &&
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted/80 active:bg-muted",
                variant === "desktop" &&
                  "inline-flex h-9 max-w-[11rem] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium",
                variant === "desktop" &&
                  (connected ? "text-foreground" : "text-muted-foreground"),
              )}
              aria-label={connected ? "Account" : "Connect wallet"}
            >
              <WalletStatusIcon
                size={variant === "desktop" ? "sm" : "md"}
                className={variant === "mobileHeader" ? "size-4" : undefined}
                iconClassName={variant === "mobileHeader" ? "size-4" : undefined}
              />
              {variant === "desktop" && (
                <span className="min-w-0 max-w-full truncate text-left">
                  {connected ? shortenAddress(account.displayName) : "Wallet"}
                </span>
              )}
            </button>
            <WalletDetailSheet
              open={accountOpen}
              onOpenChange={setAccountOpen}
            />
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
