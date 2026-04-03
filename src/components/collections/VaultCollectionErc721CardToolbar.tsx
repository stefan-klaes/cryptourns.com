"use client";

import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { CryptournLogo } from "@/components/CryptournLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";

type VaultCollectionErc721CardToolbarProps = {
  urnId: number;
  nftHref: string;
};

export function VaultCollectionErc721CardToolbar({
  urnId,
  nftHref,
}: VaultCollectionErc721CardToolbarProps) {
  return (
    <div
      className={cn(
        "absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-lg border border-border/60",
        "bg-background/90 p-0.5 shadow-sm backdrop-blur-sm",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href={`/urn/${urnId}` as Route} />}
        className="h-8 shrink-0 gap-1 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-label={`Open Cryptourn #${urnId}`}
        title={`Cryptourn #${urnId}`}
      >
        <CryptournLogo className="size-3.5 shrink-0" />
        <span className="tabular-nums leading-none">#{urnId}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        render={
          <a href={nftHref} target="_blank" rel="noopener noreferrer" />
        }
        className="size-8 text-muted-foreground hover:text-foreground"
        aria-label="View NFT on Etherscan"
        title="View NFT on Etherscan"
      >
        <EtherscanLogo className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
