"use client";

import { ResponsiveSheet } from "@/components/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SendToUrnPanel } from "@/components/urn/SendToUrnPanel";
import { Copy, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

type UrnVaultFundSectionProps = {
  tbaAddress: Address;
  chainName: string;
  explorerBaseUrl: string;
  excludeSendSelfNft?: { contractAddress: Address; tokenId: string };
};

export function UrnVaultFundSection({
  tbaAddress,
  chainName,
  explorerBaseUrl,
  excludeSendSelfNft,
}: UrnVaultFundSectionProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const short =
    tbaAddress.length > 18
      ? `${tbaAddress.slice(0, 6)}…${tbaAddress.slice(-4)}`
      : tbaAddress;

  const copyVault = async () => {
    try {
      await navigator.clipboard.writeText(tbaAddress);
      toast.success("Vault address copied");
    } catch {
      toast.error("Could not copy address");
    }
  };

  return (
    <>
      <section
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/90 to-card p-5 shadow-md ring-1 ring-primary/10 sm:p-6"
        aria-labelledby="fund-urn-heading"
      >
        <h2
          id="fund-urn-heading"
          className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          Send assets into this urn
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Vault on <span className="text-foreground/90">{chainName}</span>. Send{" "}
          <span className="text-foreground/85">ERC-20</span>,{" "}
          <span className="text-foreground/85">ERC-721</span>, or{" "}
          <span className="text-foreground/85">ERC-1155</span> to the urn
          address, or native ETH as a normal transfer. Use your wallet or any
          app that supports this network.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full flex-col gap-1 border-border bg-background/80 py-3"
            onClick={() => void copyVault()}
          >
            <span className="flex items-center justify-center gap-2 text-sm font-medium">
              <Copy className="size-4 shrink-0" aria-hidden />
              Copy {short}
            </span>
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            className="h-auto w-full flex-col gap-1 py-3"
            onClick={() => setSheetOpen(true)}
          >
            <span className="flex items-center justify-center gap-2 text-sm font-medium">
              <WalletCards className="size-4 shrink-0" aria-hidden />
              Send from wallet
            </span>
          </Button>
        </div>
      </section>

      <ResponsiveSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Send to vault"
        description="Pick a coin or NFT, confirm the amount, then sign in your wallet."
        sheetSide="right"
        sheetContentClassName="!w-[min(100vw-1.25rem,22rem)] sm:!w-[min(100vw-2rem,28rem)] sm:!max-w-[min(100vw-2rem,28rem)]"
        drawerContentClassName="mx-auto w-[calc(100vw-1rem)] max-w-[28rem]"
      >
        {sheetOpen ? (
          <SendToUrnPanel
            embedded
            tbaAddress={tbaAddress}
            chainName={chainName}
            explorerBaseUrl={explorerBaseUrl}
            excludeSendSelfNft={excludeSendSelfNft}
          />
        ) : null}
      </ResponsiveSheet>
    </>
  );
}
