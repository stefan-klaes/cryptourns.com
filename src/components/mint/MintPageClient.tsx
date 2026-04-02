"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { AddressList } from "@/components/mint/AddressList";
import { MintProgressDialog } from "@/components/mint/MintProgressDialog";
import { PriceSummary } from "@/components/mint/PriceSummary";
import { UrnMintHeroPreview } from "@/components/urn/UrnMintHeroPreview";
import { Button } from "@/components/ui/button";
import { useMint } from "@/hooks/useMint";
import {
  REFERRAL_SESSION_KEY,
  parseReferralAddress,
} from "@/lib/referral/referralSession";
import { useCryptourns } from "@/providers/CryptournsProvider";

export function MintPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    mintPriceWei,
    formattedMintPrice,
    totalSupply,
    mintPaused,
    loading: cryptournsLoading,
  } = useCryptourns();
  const { step, isOpen, mint, reset, errorMessage, mintedTokenIds } = useMint();

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
  const referralFromQuery = useMemo(
    () => parseReferralAddress(searchParams.get("ref")),
    [searchParams],
  );

  const [referralFromSession, setReferralFromSession] = useState<
    Address | undefined
  >();
  useEffect(() => {
    setReferralFromSession(
      parseReferralAddress(
        typeof window !== "undefined"
          ? sessionStorage.getItem(REFERRAL_SESSION_KEY)
          : null,
      ),
    );
  }, [searchParams]);

  const activeReferral = referralFromQuery ?? referralFromSession;

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
    if (addresses.length === 0 || mintPaused) return;
    void mint(addresses, activeReferral);
  };

  const handleComplete = () => {
    reset();
    if (mintedTokenIds.length === 1) {
      router.push(`/urn/${mintedTokenIds[0]!.toString()}`);
      return;
    }
    router.push("/urns");
  };

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        {/* Left column — Preview */}
        <div className="mx-auto flex w-full max-w-xs flex-col md:max-w-none">
          <UrnMintHeroPreview
            variant="compact"
            emptySeed={emptyMosaicSeed ?? undefined}
          />
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
            {activeReferral ? (
              <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Referral link active — the referrer earns a share of this mint
                when you complete checkout.
              </p>
            ) : null}
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

          {isConnected && mintPaused ? (
            <p className="text-center text-sm text-amber-600 dark:text-amber-500">
              Minting is paused on the contract.
            </p>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            onClick={handleMint}
            disabled={
              isOpen ||
              (isConnected &&
                (addresses.length === 0 || mintPaused || cryptournsLoading))
            }
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
        errorMessage={errorMessage}
        onComplete={handleComplete}
      />
    </>
  );
}
