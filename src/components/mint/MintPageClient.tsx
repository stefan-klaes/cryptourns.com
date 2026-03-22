"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { AddressList } from "@/components/mint/AddressList";
import { MintProgressDialog } from "@/components/mint/MintProgressDialog";
import { PriceSummary } from "@/components/mint/PriceSummary";
import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { Button } from "@/components/ui/button";
import { useMint } from "@/hooks/useMint";
import { useCryptourns } from "@/providers/CryptournsProvider";

export function MintPageClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { mintPriceWei, formattedMintPrice, totalSupply, loading: cryptournsLoading } =
    useCryptourns();
  const { step, isOpen, mint, reset } = useMint();

  const [manualAddresses, setManualAddresses] = useState<Address[]>([]);
  const [hiddenConnectedAddress, setHiddenConnectedAddress] = useState<
    string | null
  >(null);
  /**
   * Random mosaic after mount only — avoids SSR/client UUID mismatch (hydration error).
   * First paint uses UrnRenderer’s useId(); then we swap to a per-session seed.
   */
  const [emptyMosaicSeed, setEmptyMosaicSeed] = useState<string | null>(null);
  useEffect(() => {
    setEmptyMosaicSeed(crypto.randomUUID());
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
              seed={emptyMosaicSeed ?? undefined}
              className="w-full"
            />
          </div>
          <p className="text-center text-xs leading-relaxed text-primary md:text-left">
            New urns start as neutral grey stone. Sending the first NFT or
            tokens into the urn&apos;s account reveals its unique on-chain
            palette.
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
            <p className="mt-2 text-sm tabular-nums text-muted-foreground">
              {cryptournsLoading ? (
                <span className="inline-block h-4 w-28 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {totalSupply.toLocaleString()}
                  </span>{" "}
                  {totalSupply === 1 ? "urn" : "urns"} minted
                </>
              )}
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
            pricePerUnit={mintPriceWei}
            formattedPrice={formattedMintPrice}
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
