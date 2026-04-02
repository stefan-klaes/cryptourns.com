"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { zeroAddress } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Button, buttonVariants } from "@/components/ui/button";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { formatEthereum } from "@/lib/utils/formatEthereum";
import { cn } from "@/lib/utils";

const CANONICAL_ORIGIN = "https://cryptourns.com";

export function EarningsPageClient() {
  const { name: chainName } = getCryptournsChainConfig();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();

  const [origin, setOrigin] = useState(CANONICAL_ORIGIN);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const [copiedLink, setCopiedLink] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | undefined>();
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimPending, setClaimPending] = useState(false);

  const { data: defaultShareRaw, isLoading: defaultShareLoading } =
    useReadContract({
      ...CRYPTOURNS_CONTRACT,
      functionName: "getReferralShare",
      args: [zeroAddress],
    });

  const { data: userShareRaw, isLoading: userShareLoading } = useReadContract({
    ...CRYPTOURNS_CONTRACT,
    functionName: "getReferralShare",
    args: [address ?? zeroAddress],
    query: { enabled: Boolean(address) },
  });

  const {
    data: claimableWei,
    isLoading: claimableLoading,
    refetch: refetchClaimable,
  } = useReadContract({
    ...CRYPTOURNS_CONTRACT,
    functionName: "claimableEarningsFor",
    args: [address!],
    query: { enabled: Boolean(address) },
  });

  const defaultShare =
    defaultShareRaw !== undefined ? Number(defaultShareRaw) : null;
  const userShare =
    userShareRaw !== undefined && address ? Number(userShareRaw) : null;

  const referralUrl =
    address && origin
      ? `${origin}/mint?ref=${encodeURIComponent(address)}`
      : "";

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const {
    isSuccess: claimReceiptSuccess,
    isError: claimReceiptError,
  } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  useEffect(() => {
    if (!claimReceiptSuccess || !claimTxHash) return;
    void refetchClaimable();
    setClaimTxHash(undefined);
    setClaimPending(false);
  }, [claimReceiptSuccess, claimTxHash, refetchClaimable]);

  useEffect(() => {
    if (!claimReceiptError || !claimTxHash) return;
    setClaimError("Claim transaction failed on-chain.");
    setClaimTxHash(undefined);
    setClaimPending(false);
  }, [claimReceiptError, claimTxHash]);

  const handleClaim = useCallback(async () => {
    if (!address || !claimableWei || claimableWei === BigInt(0)) return;
    setClaimError(null);
    setClaimPending(true);
    try {
      if (chainId !== CRYPTOURNS_CONTRACT.chainId) {
        if (!switchChainAsync) {
          const { name } = getCryptournsChainConfig();
          throw new Error(`Switch to ${name} in your wallet to claim.`);
        }
        await switchChainAsync({ chainId: CRYPTOURNS_CONTRACT.chainId });
      }
      const hash = await writeContractAsync({
        address: CRYPTOURNS_CONTRACT.address,
        abi: CRYPTOURNS_CONTRACT.abi,
        chainId: CRYPTOURNS_CONTRACT.chainId,
        functionName: "claimEarnings",
        args: [address],
      });
      setClaimTxHash(hash);
    } catch (e) {
      setClaimPending(false);
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setClaimError(
        /user rejected|denied|rejected the request/i.test(msg)
          ? "Signature rejected in wallet."
          : msg,
      );
    }
  }, [address, chainId, claimableWei, switchChainAsync, writeContractAsync]);

  const claimableDisplay =
    claimableWei !== undefined ? formatEthereum(claimableWei, 4) : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Referral earnings
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cryptourns are on-chain urns with token-bound accounts: a place to
          gather NFTs and tokens with a look that grows as the urn fills.
          When you share your mint link, you help collectors put idle or
          floor holdings to work inside the ecosystem — and the contract pays
          you a slice of every qualifying mint routed through that link.
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
            address you confirm in your wallet (we use your connected
            address).
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          If you mint using your own referral link, the contract does not pay
          you a referral on that transaction — the minter and referrer cannot
          be the same wallet for a payout.
        </p>
      </section>

      {!isConnected ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to copy your personal mint link and see what
            you can claim.
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
        <section className="space-y-6" aria-labelledby="dashboard-heading">
          <h2
            id="dashboard-heading"
            className="text-sm font-semibold text-foreground"
          >
            Your dashboard
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your referral rate
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {userShareLoading ? (
                  <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" />
                ) : userShare !== null ? (
                  `${userShare}%`
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className="flex flex-col rounded-lg border border-border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Available to claim
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {claimableLoading ? (
                  <span className="inline-block h-8 w-24 animate-pulse rounded bg-muted" />
                ) : (
                  `${claimableDisplay} ETH`
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Only unclaimed balances appear here. Amounts you already
                claimed were transferred on-chain.
              </p>
              {claimError ? (
                <p className="mt-3 text-sm text-destructive">{claimError}</p>
              ) : null}
              <Button
                size="lg"
                className="mt-4 w-full"
                disabled={
                  claimPending ||
                  claimableLoading ||
                  !claimableWei ||
                  claimableWei === BigInt(0)
                }
                onClick={() => void handleClaim()}
              >
                {claimPending ? "Confirm in wallet…" : "Claim earnings"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your mint link
            </p>
            <p className="mt-1 break-all font-mono text-sm text-foreground">
              {referralUrl}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => void handleCopyLink()}
              >
                {copiedLink ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copiedLink ? "Copied" : "Copy link"}
              </Button>
              <Link
                href={`/mint?ref=${encodeURIComponent(address!)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open mint with ref
              </Link>
            </div>
          </div>

        </section>
      )}

      <p className="text-center text-sm text-muted-foreground">
        New to minting?{" "}
        <Link href="/mint" className="font-medium text-foreground underline-offset-4 hover:underline">
          Go to mint
        </Link>
      </p>
    </div>
  );
}
