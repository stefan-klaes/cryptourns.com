"use client";

import Link from "next/link";
import type { Route } from "next";

import { UrnPreviewImage } from "@/components/wallet/UrnPreviewImage";
import { buttonVariants } from "@/components/ui/button";
import { useOwnedCryptournsQuery } from "@/hooks/useOwnedCryptournsQuery";
import { parseUrnIdFromTokenId } from "@/lib/wallet/parseUrnTokenId";
import { cn } from "@/lib/utils";

export function OwnedUrnsGrid() {
  const { data, isLoading, isError, error } = useOwnedCryptournsQuery();

  const urns = data?.cryptourns ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : "Could not load your urns."}
      </p>
    );
  }

  if (urns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-muted-foreground text-sm leading-relaxed">
          No Cryptourns in this wallet yet. Mint to create an urn with its own
          on-chain vault.
        </p>
        <Link
          href="/mint"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4 inline-flex",
          )}
        >
          Go to mint
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {urns.map((u) => {
        const urnId = parseUrnIdFromTokenId(u.tokenId);
        const label =
          urnId !== null ? `Cryptourn #${urnId}` : `Cryptourn #${u.tokenId}`;
        const href =
          urnId !== null
            ? (`/urn/${urnId}` as Route)
            : (`/urn/${u.tokenId}` as Route);

        return (
          <li key={`${u.contractAddress}-${u.tokenId}`}>
            <Link
              href={href}
              className="group block overflow-hidden rounded-lg border border-border bg-card/40 transition-colors hover:border-foreground/20"
            >
              <div className="relative aspect-square w-full border-b border-border">
                {urnId !== null ? (
                  <UrnPreviewImage
                    urnId={urnId}
                    alchemyImageRaw={u.image}
                    alt={label}
                    width={400}
                    height={400}
                    className="absolute inset-0 size-full"
                    imgClassName="object-contain object-center transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                    Invalid id
                  </div>
                )}
              </div>
              <p className="truncate p-2 text-center text-xs font-medium text-foreground">
                {label}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
