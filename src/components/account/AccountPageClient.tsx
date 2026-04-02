"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";

import { ReferralEarningsDashboard } from "@/components/referral/ReferralEarningsDashboard";
import { OwnedUrnsGrid } from "@/components/wallet/OwnedUrnsGrid";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";

export function AccountPageClient() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Account</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Urns linked to your wallet and referral earnings from shared mint
          links.
        </p>
      </header>

      {!isConnected ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to see Cryptourns you own and manage referral
            earnings.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => openConnectModal?.()}
          >
            Connect wallet
          </Button>
        </div>
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="account-urns-heading">
            <h2
              id="account-urns-heading"
              className="text-sm font-semibold text-foreground"
            >
              Your urns
            </h2>
            <OwnedUrnsGrid />
          </section>

          <ReferralEarningsDashboard title="Referral earnings" />
        </>
      )}
    </div>
  );
}
