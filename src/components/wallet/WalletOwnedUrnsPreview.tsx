"use client";

import { Box } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { UrnPreviewImage } from "@/components/wallet/UrnPreviewImage";
import { useOwnedCryptournsQuery } from "@/hooks/useOwnedCryptournsQuery";
import { cn } from "@/lib/utils";
import { parseUrnIdFromTokenId } from "@/lib/wallet/parseUrnTokenId";

type WalletOwnedUrnsPreviewProps = {
  /** When false, skips portfolio fetch until the user opens the sheet. */
  sheetOpen: boolean;
  /** e.g. close the wallet sheet after navigation. */
  onNavigateAway?: () => void;
};

export function WalletOwnedUrnsPreview({
  sheetOpen,
  onNavigateAway,
}: WalletOwnedUrnsPreviewProps) {
  const { data, isLoading, isError, error } = useOwnedCryptournsQuery({
    enabled: sheetOpen,
  });

  const urns = data?.cryptourns ?? [];

  const first = urns[0];
  const urnId = first ? parseUrnIdFromTokenId(first.tokenId) : null;
  const cryptournLabel = urnId !== null ? `Cryptourn #${urnId}` : "";

  const count = urns.length;
  const moreCount = count > 1 ? count - 1 : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/40 p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Your Cryptourns
      </p>

      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="size-14 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Could not load your urns."}
        </p>
      ) : count === 0 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            This wallet doesn&apos;t hold a Cryptourn yet. Mint one to get an
            on-chain urn with its own token-bound vault.
          </p>
          <Link
            href="/mint"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Mint an urn
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <Link
            href={
              (urnId !== null
                ? `/urn/${urnId}`
                : `/urn/${first!.tokenId}`) as Route
            }
            onClick={() => onNavigateAway?.()}
            className={cn(
              "-m-1 flex gap-3 rounded-lg p-1 text-left outline-none transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {urnId !== null ? (
              <UrnPreviewImage
                urnId={urnId}
                alchemyImageRaw={first!.image}
                alt={cryptournLabel}
                width={112}
                height={112}
                className="size-14 shrink-0 rounded-md border border-border"
                imgClassName="object-contain object-center"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                <Box className="size-6" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1 py-0.5">
              <p className="text-sm font-medium text-foreground">
                {cryptournLabel || `Cryptourn #${first!.tokenId}`}
              </p>
              {count === 1 ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  View details and fund the token-bound vault anytime.
                </p>
              ) : null}
            </div>
          </Link>
          {count > 1 ? (
            <p className="text-muted-foreground pl-1 text-xs leading-relaxed mt-2">
              You own{" "}
              <span className="font-medium text-foreground">{moreCount}</span>{" "}
              more Cryptourn{moreCount === 1 ? "" : "s"}.
              <span className="text-muted-foreground/90">
                {" "}
                <Link
                  href={"/account" as Route}
                  onClick={() => onNavigateAway?.()}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  See all in your account
                </Link>
                .
              </span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
