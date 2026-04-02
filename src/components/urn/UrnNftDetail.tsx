import { LightCandleButton } from "@/components/urn/LightCandleButton";
import { UrnIndexedAssetsSection } from "@/components/urn/UrnIndexedAssetsSection";
import { UrnOwnerByline } from "@/components/urn/UrnOwnerByline";
import { UrnVaultFundSection } from "@/components/urn/UrnVaultFundSection";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { UrnIndexedAssetRow } from "@/lib/urn/getUrnIndexedAssets";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import Image from "next/image";
import Link from "next/link";
import type { Address } from "viem";

type UrnNftDetailProps = {
  urnId: number;
  metadata: UrnMetadata;
  /** DB candle row count (same value as Candles trait). */
  candleCount: number;
  tbaAddress: Address;
  chainName: string;
  ownerAddress: string | null;
  ownerEnsName: string | null;
  ownerExplorerBaseUrl: string;
  indexedCoins: UrnIndexedAssetRow[];
  indexedNfts: UrnIndexedAssetRow[];
};

export function UrnNftDetail({
  urnId,
  metadata,
  candleCount,
  tbaAddress,
  chainName,
  ownerAddress,
  ownerEnsName,
  ownerExplorerBaseUrl,
  indexedCoins,
  indexedNfts,
}: UrnNftDetailProps) {
  const { image, name, description } = metadata;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[420px] w-[70%] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[380px] w-[60%] rounded-full bg-chart-2/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link
            href="/urns"
            className="transition-colors hover:text-foreground"
          >
            Urns
          </Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">{name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="aspect-square bg-muted/30">
              <Image
                src={image}
                alt={name}
                width={1200}
                height={1200}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <header className="space-y-3">
              <div className="flex w-full min-w-0 items-baseline justify-between gap-3">
                <p className="shrink-0 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  Cryptourns
                </p>
                {ownerAddress ? (
                  <UrnOwnerByline
                    ownerAddress={ownerAddress}
                    ownerEnsName={ownerEnsName}
                    ownerExplorerBaseUrl={ownerExplorerBaseUrl}
                  />
                ) : null}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {name}
              </h1>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
              <LightCandleButton
                key={urnId}
                urnId={urnId}
                initialCount={candleCount}
                className="-ml-1"
              />
            </header>

            <UrnVaultFundSection
              tbaAddress={tbaAddress}
              chainName={chainName}
              explorerBaseUrl={ownerExplorerBaseUrl}
              excludeSendSelfNft={{
                contractAddress: CRYPTOURNS_CONTRACT.address,
                tokenId: String(urnId),
              }}
            />
          </div>
        </div>

        <UrnIndexedAssetsSection
          urnId={urnId}
          explorerBaseUrl={ownerExplorerBaseUrl}
          coins={indexedCoins}
          nfts={indexedNfts}
        />
      </div>
    </main>
  );
}
