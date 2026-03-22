"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { AddressList } from "@/components/mint/AddressList";
import { MintProgressDialog } from "@/components/mint/MintProgressDialog";
import { PriceSummary } from "@/components/mint/PriceSummary";
import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMint } from "@/hooks/useMint";
import { useMintPrice } from "@/hooks/useMintPrice";

export function MintPageClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { price, formatted } = useMintPrice();
  const { step, isOpen, mint, reset } = useMint();

  const [manualAddresses, setManualAddresses] = useState<Address[]>([]);
  const [hiddenConnectedAddress, setHiddenConnectedAddress] = useState<
    string | null
  >(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    let steps = 0;
    const id = window.setInterval(() => {
      setPreviewKey((k) => k + 1);
      steps += 1;
      if (steps >= 4) window.clearInterval(id);
    }, 300);
    return () => window.clearInterval(id);
  }, []);
  const connectedAddressNormalized = address?.toLowerCase() ?? null;
  const addresses = useMemo(() => {
    const next = [...manualAddresses];

    if (
      address &&
      hiddenConnectedAddress !== connectedAddressNormalized &&
      !next.some((entry) => entry.toLowerCase() === connectedAddressNormalized)
    ) {
      next.unshift(address);
    }

    return next;
  }, [
    address,
    connectedAddressNormalized,
    hiddenConnectedAddress,
    manualAddresses,
  ]);

  const handleAdd = useCallback((addr: Address) => {
    setManualAddresses((prev) => [...prev, addr]);
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      const target = addresses[index];
      if (!target) return;

      if (
        connectedAddressNormalized &&
        target.toLowerCase() === connectedAddressNormalized
      ) {
        setHiddenConnectedAddress(connectedAddressNormalized);
        return;
      }

      setManualAddresses((prev) => prev.filter((entry) => entry !== target));
    },
    [addresses, connectedAddressNormalized],
  );

  const handleMint = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    mint();
  };

  const handleComplete = () => {
    reset();
    router.push("/urns/mock-urn-1" as never);
  };

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        {/* Left column — Preview */}
        <div className="mx-auto flex w-full max-w-xs flex-col gap-2 md:max-w-none">
          <div className="relative w-full">
            <UrnRenderer
              assetCount={0}
              candleCount={0}
              seed={`mint-${previewKey}`}
              className="w-full"
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 left-2 z-10 size-9 text-primary shadow-sm ring-2 ring-primary/25 animate-[pulse_2.2s_ease-in-out_infinite] hover:animate-none hover:bg-primary/10 hover:text-primary"
                    aria-label="Generate a new random preview"
                    onClick={() => setPreviewKey((k) => k + 1)}
                  >
                    <Sparkles data-icon="inline-start" aria-hidden />
                  </Button>
                }
              />
              <TooltipContent side="top" align="start">
                Generate a new random color preview
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-center text-xs leading-relaxed text-primary md:text-left">
            Colors are randomly generated at mint—your urn&apos;s palette is
            revealed on-chain when you mint.
          </p>
        </div>

        {/* Right column — Mint form */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Mint an Urn
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mint unique on-chain urns to your wallet or gift them to others.
            </p>
          </div>

          {isConnected ? (
            <AddressList
              connectedAddress={address}
              addresses={addresses}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Connect your wallet to start minting.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => openConnectModal?.()}
              >
                Connect Wallet
              </Button>
            </div>
          )}

          <PriceSummary
            pricePerUnit={price}
            formattedPrice={formatted}
            count={Math.max(addresses.length, 1)}
          />

          <Button
            size="lg"
            className="w-full"
            onClick={handleMint}
            disabled={isOpen}
          >
            {isConnected
              ? `Mint ${addresses.length > 1 ? `${addresses.length} Urns` : "Urn"}`
              : "Connect Wallet"}
          </Button>
        </div>
      </div>

      <MintProgressDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) reset();
        }}
        step={step}
        onComplete={handleComplete}
      />
    </>
  );
}
