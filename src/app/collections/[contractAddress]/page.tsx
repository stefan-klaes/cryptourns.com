import { VaultCollectionDetail } from "@/components/collections/VaultCollectionDetail";
import {
  getVaultCollectionAssetTypes,
  getVaultCollectionErc721Tokens,
  getVaultCollectionFungibleUrns,
  getVaultCollectionMeta,
  getVaultCollectionStats,
} from "@/lib/collections/getVaultCollectionDetail";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAddress } from "viem";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ contractAddress: string }>;
};

export default async function VaultCollectionPage({ params }: PageProps) {
  const { contractAddress: raw } = await params;
  const contractAddress = raw.toLowerCase();
  if (!isAddress(contractAddress)) {
    notFound();
  }

  const [stats, erc721Tokens, fungibleUrns, meta, types, { explorerBaseUrl }] =
    await Promise.all([
      getVaultCollectionStats(contractAddress),
      getVaultCollectionErc721Tokens(contractAddress),
      getVaultCollectionFungibleUrns(contractAddress),
      getVaultCollectionMeta(contractAddress),
      getVaultCollectionAssetTypes(contractAddress),
      Promise.resolve(getCryptournsChainConfig()),
    ]);

  if (stats.totalIndexedQuantity === 0) {
    notFound();
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        aria-hidden
      >
        <div className="absolute -left-1/3 top-0 h-[320px] w-[60%] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-1/4 h-[280px] w-[50%] rounded-full bg-chart-3/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl space-y-8">
        <p className="text-sm">
          <Link
            href="/collections"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Collections
          </Link>
        </p>

        <VaultCollectionDetail
          contractAddress={contractAddress}
          meta={meta}
          types={types}
          erc721Tokens={erc721Tokens}
          fungibleUrns={fungibleUrns}
          totalIndexedQuantity={stats.totalIndexedQuantity}
          inUrnsCount={stats.inUrnsCount}
          explorerBaseUrl={explorerBaseUrl}
        />
      </div>
    </main>
  );
}
