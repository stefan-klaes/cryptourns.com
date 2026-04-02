"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { ReferralEarningsDashboard } from "@/components/referral/ReferralEarningsDashboard";
import { Button } from "@/components/ui/button";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";

export function EarningsPageClient() {
  const { name: chainName } = getCryptournsChainConfig();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const { data: defaultShareRaw, isLoading: defaultShareLoading } =
    useReadContract({
      ...CRYPTOURNS_CONTRACT,
      functionName: "getReferralShare",
      args: [zeroAddress],
    });

  const defaultShare =
    defaultShareRaw !== undefined ? Number(defaultShareRaw) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Referral earnings
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cryptourns are on-chain urns with token-bound accounts: a place to
          gather NFTs and tokens with a look that grows as the urn fills. When
          you share your mint link, you help collectors put idle or floor
          holdings to work inside the ecosystem — and the contract pays you a
          slice of every qualifying mint routed through that link.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {defaultShareLoading ? (
            <span className="inline-block h-4 w-40 animate-pulse rounded bg-muted" />
          ) : defaultShare !== null ? (
            <>
              The program currently routes{" "}
              <span className="font-medium text-foreground">
                {defaultShare}%
              </span>{" "}
              of each paid mint to the referrer (before gas). Your wallet may
              use a different rate if the contract assigned a custom share.
            </>
          ) : null}
        </p>
      </header>

      <section
        className="rounded-lg border border-border bg-card/30 p-5"
        aria-labelledby="how-it-works-heading"
      >
        <h2
          id="how-it-works-heading"
          className="text-sm font-semibold text-foreground"
        >
          How it works
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            Someone opens your link and mints on {chainName} using our app.
          </li>
          <li>
            Their payment includes mint price; the contract credits your share
            to your wallet&apos;s referral balance.
          </li>
          <li>
            You claim accrued ETH here whenever you like; it is sent to the
            address you confirm in your wallet (we use your connected address).
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          If you mint using your own referral link, the contract does not pay
          you a referral on that transaction — the minter and referrer cannot be
          the same wallet for a payout.
        </p>
      </section>

      {!isConnected ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to copy your personal mint link and see what you
            can claim.
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
        <ReferralEarningsDashboard />
      )}

      <p className="text-center text-sm text-muted-foreground">
        New to minting?{" "}
        <Link
          href="/mint"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Go to mint
        </Link>
      </p>
    </div>
  );
}
