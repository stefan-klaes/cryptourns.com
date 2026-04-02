import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import {
  UrnsListPagination,
  UrnsListSortBar,
} from "@/components/urn/UrnsListControls";
import { UrnCard } from "@/components/urn/UrnCard";
import { UrnsPageHeader } from "@/components/urn/UrnsPageHeader";
import { getIndexedVaultTotals } from "@/lib/urn/getIndexedVaultTotals";
import {
  countUrns,
  findManyUrns,
  parseUrnsListSearchParams,
  urnsListHref,
} from "@/lib/urn/findManyUrns";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

function traitNumber(
  attributes: UrnMetadata["attributes"],
  traitType: string,
): number {
  const a = attributes.find((x) => x.trait_type === traitType);
  return typeof a?.value === "number" ? a.value : 0;
}

function isCracked(attributes: UrnMetadata["attributes"]): boolean {
  const a = attributes.find((x) => x.trait_type === "Cracked");
  return a?.value === "Yes";
}

export const dynamic = "force-dynamic";

type UrnsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UrnsPage({ searchParams }: UrnsPageProps) {
  const raw = (await searchParams) ?? {};
  const { page, sort, limit } = parseUrnsListSearchParams(raw);

  const [totalIndexed, vaultTotals, totalOnChain] = await Promise.all([
    countUrns(),
    getIndexedVaultTotals(),
    new AlchemyProvider().getCryptournsSupply().catch(() => 0),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalIndexed / limit));
  const safePage = Math.min(page, totalPages);
  if (page !== safePage) {
    redirect(urnsListHref(sort, safePage) as Route);
  }

  const urns = await findManyUrns({
    page: safePage,
    limit,
    sortBy: sort,
  });

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-x-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        aria-hidden
      >
        <div className="absolute -left-1/3 top-0 h-[360px] w-[65%] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-1/4 h-[320px] w-[55%] rounded-full bg-chart-3/12 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[280px] w-[50%] rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <UrnsPageHeader
          totalIndexed={totalIndexed}
          totalOnChain={totalOnChain}
          assetUnits={vaultTotals.assetUnits}
          candles={vaultTotals.candles}
        />

        {totalIndexed === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
            <p className="text-muted-foreground">
              No urns in the index yet. Open an urn page or run a sync to
              populate the database.
            </p>
            <p className="mt-4">
              <Link
                href="/mint"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Go to mint
              </Link>
            </p>
          </div>
        ) : (
          <>
            <UrnsListSortBar
              sort={sort}
              page={safePage}
              totalCount={totalIndexed}
              pageSize={limit}
            />
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {urns.map((metadata) => {
                const urnId = metadata.tokenId;
                return (
                  <li key={urnId}>
                    <UrnCard
                      urnId={urnId}
                      nftCount={traitNumber(metadata.attributes, "NFTs")}
                      coinCount={traitNumber(metadata.attributes, "Coins")}
                      candleCount={traitNumber(metadata.attributes, "Candles")}
                      cracked={isCracked(metadata.attributes)}
                    />
                  </li>
                );
              })}
            </ul>
            <UrnsListPagination
              sort={sort}
              page={safePage}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </main>
  );
}
