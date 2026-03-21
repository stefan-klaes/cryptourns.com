"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { AddressList } from "@/components/mint/AddressList";
import { MintProgressDialog } from "@/components/mint/MintProgressDialog";
import { PriceSummary } from "@/components/mint/PriceSummary";
import { UrnPreview } from "@/components/mint/UrnPreview";
import { Button } from "@/components/ui/button";
import { useMint } from "@/hooks/useMint";
import { useMintPrice } from "@/hooks/useMintPrice";

export function MintPageClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { price, formatted } = useMintPrice();
  const { step, isOpen, mint, reset } = useMint();

  const [addresses, setAddresses] = useState<Address[]>([]);

  // Sync connected wallet address
  useEffect(() => {
    setAddresses(address ? [address] : []);
  }, [address]);

  const handleAdd = useCallback((addr: Address) => {
    setAddresses((prev) => [...prev, addr]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
        <UrnPreview className="mx-auto w-full max-w-xs md:max-w-none" />

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
