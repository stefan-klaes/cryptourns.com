"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

import { WalletDetailSheet } from "@/components/WalletDetailSheet";
import { WalletStatusIcon } from "@/components/WalletStatusIcon";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/utils/shortenAddress";

type WalletConnectButtonProps = {
  variant?: "mobile" | "desktop";
};

export function WalletConnectButton({
  variant = "mobile",
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
                variant === "mobile" &&
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2",
                variant === "desktop" &&
                  "inline-flex h-9 max-w-[11rem] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium",
                connected ? "text-foreground" : "text-muted-foreground",
              )}
              aria-label={connected ? "Account" : "Connect wallet"}
            >
              <WalletStatusIcon size={variant === "desktop" ? "sm" : "md"} />
              <span
                className={cn(
                  "max-w-full truncate",
                  variant === "mobile" &&
                    "text-center text-[0.65rem] font-semibold leading-none tracking-tight",
                  variant === "desktop" && "min-w-0 text-left",
                )}
              >
                {connected ? shortenAddress(account.displayName) : "Wallet"}
              </span>
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
