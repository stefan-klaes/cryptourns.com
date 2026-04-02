import { VaultAssetsCatalog } from "@/components/collections/VaultAssetsCatalog";
import {
  countUrnsWithAnyAsset,
  getVaultAssetsCatalog,
} from "@/lib/collections/getVaultAssetsCatalog";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import type { AssetType } from "@/generated/prisma";
import { unstable_noStore as noStore } from "next/cache";

function isErc20Only(types: AssetType[]): boolean {
  return types.length === 1 && types[0] === "ERC20";
}

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  noStore();
  const [rows, urnsWithAssets, { explorerBaseUrl }] = await Promise.all([
    getVaultAssetsCatalog(),
    countUrnsWithAnyAsset(),
    Promise.resolve(getCryptournsChainConfig()),
  ]);

  const nftEntries = rows.filter((r) => !isErc20Only(r.types)).length;
  const coinEntries = rows.filter((r) => isErc20Only(r.types)).length;
  const totalPieces = rows.reduce((acc, r) => acc + r.totalIndexedQuantity, 0);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        aria-hidden
      >
        <div className="absolute -left-1/3 top-0 h-[320px] w-[60%] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-1/4 h-[280px] w-[50%] rounded-full bg-chart-3/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl space-y-12">
        <header className="space-y-8">
          {rows.length > 0 ? (
            <div className="space-y-5 rounded-2xl border border-border bg-muted/40 px-6 py-10 sm:px-10">
              <p className="text-5xl font-bold leading-none tracking-tighter tabular-nums sm:text-7xl lg:text-8xl">
                {totalPieces.toLocaleString()}
              </p>
              <p className="max-w-2xl text-xl font-medium leading-snug text-muted-foreground sm:text-2xl">
                Total pieces living in urns — JPEGs, editions, coins, whatever
                the vaults are holding.
              </p>
              <div className="flex flex-col gap-4 pt-1">
                <p className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-lg font-medium text-foreground sm:text-xl">
                  <span className="whitespace-nowrap">
                    <span className="tabular-nums text-2xl font-bold sm:text-3xl">
                      {urnsWithAssets.toLocaleString()}
                    </span>{" "}
                    <span className="text-muted-foreground">urns</span>
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="tabular-nums text-2xl font-bold sm:text-3xl">
                      {rows.length}
                    </span>{" "}
                    <span className="text-muted-foreground">contracts</span>
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="tabular-nums text-2xl font-bold sm:text-3xl">
                      {nftEntries}
                    </span>{" "}
                    <span className="text-muted-foreground">NFT</span>
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="tabular-nums text-2xl font-bold sm:text-3xl">
                      {coinEntries}
                    </span>{" "}
                    <span className="text-muted-foreground">coins</span>
                  </span>
                </p>
                <p className="text-sm font-semibold text-primary sm:text-base">
                  Pick a contract below → see which urns hold it
                </p>
              </div>
            </div>
          ) : null}
        </header>

        <VaultAssetsCatalog rows={rows} explorerBaseUrl={explorerBaseUrl} />
      </div>
    </main>
  );
}
