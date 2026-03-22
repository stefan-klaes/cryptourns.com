import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import { UrnCard } from "@/components/urn/UrnCard";
import { findManyUrns } from "@/lib/urn/findManyUrns";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import Link from "next/link";

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

export default async function UrnsPage() {
  const urns = await findManyUrns();

  let totalOnChain = 0;
  try {
    totalOnChain = await new AlchemyProvider().getCryptournsSupply();
  } catch {
    /* optional header stat */
  }

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
        <header className="mb-10 max-w-2xl space-y-3">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Collection
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Urns
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Indexed token-bound urns from the database.{" "}
            <span className="font-medium text-foreground tabular-nums">
              {urns.length}
            </span>{" "}
            {urns.length === 1 ? "urn" : "urns"} synced
            {totalOnChain > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums">{totalOnChain}</span> total
                minted on-chain
              </>
            ) : null}
            .
          </p>
          <p className="text-sm">
            <Link
              href="/mint"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Mint an urn
            </Link>
          </p>
        </header>

        {urns.length === 0 ? (
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
        )}
      </div>
    </main>
  );
}
