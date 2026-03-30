import { RefreshUrnMetadataButton } from "@/components/admin/RefreshUrnMetadataButton";
import { SyncMissingUrnsButton } from "@/components/admin/SyncMissingUrnsButton";
import { db } from "@/lib/clients/db";
import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUrnsPage() {
  const urns = await db.urn.findMany({
    orderBy: { id: "asc" },
    include: {
      _count: { select: { assets: true, candles: true } },
    },
  });

  let totalSupply: number | null = null;
  let supplyError: string | null = null;
  try {
    totalSupply = await new AlchemyProvider().getCryptournsSupply();
  } catch (err) {
    supplyError =
      err instanceof Error ? err.message : "Failed to read on-chain supply";
  }

  const dbIds = new Set(urns.map((u) => u.id));
  const missingInDb: number[] = [];
  if (totalSupply != null && totalSupply > 0) {
    for (let id = 1; id <= totalSupply; id++) {
      if (!dbIds.has(id)) missingInDb.push(id);
    }
  }

  const inSync =
    totalSupply != null &&
    urns.length === totalSupply &&
    missingInDb.length === 0;

  return (
    <main>
      <h2 className="text-lg font-semibold tracking-tight">Urn index</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Database rows versus collection total supply (token ids{" "}
        <span className="font-mono">1 … N</span>).
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            In database
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {urns.length}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 px-4 py-3">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            Total supply (chain)
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {totalSupply != null ? (
              totalSupply
            ) : (
              <span className="text-base font-normal text-destructive">
                Unavailable
              </span>
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-card/40 px-4 py-3 sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground uppercase">
            Coverage
          </dt>
          <dd className="mt-1 text-sm">
            {supplyError ? (
              <span className="text-destructive">{supplyError}</span>
            ) : inSync ? (
              <span className="text-emerald-600 dark:text-emerald-500">
                All minted token ids have a database row.
              </span>
            ) : (
              <span>
                <span className="font-medium text-foreground">
                  {missingInDb.length}
                </span>{" "}
                token{" "}
                {missingInDb.length === 1 ? "id is" : "ids are"} missing from
                the database
                {missingInDb.length > 0 && missingInDb.length <= 24 ? (
                  <span className="mt-1 block font-mono text-xs text-muted-foreground">
                    {missingInDb.join(", ")}
                  </span>
                ) : missingInDb.length > 24 ? (
                  <span className="mt-1 block font-mono text-xs text-muted-foreground">
                    {missingInDb.slice(0, 24).join(", ")} …
                  </span>
                ) : null}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SyncMissingUrnsButton
          missingCount={missingInDb.length}
          disabled={supplyError != null || totalSupply == null}
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2.5 font-medium">ID</th>
              <th className="px-3 py-2.5 font-medium">TBA</th>
              <th className="px-3 py-2.5 font-medium">Cracked</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">Assets</th>
              <th className="px-3 py-2.5 font-medium tabular-nums">
                Candles
              </th>
              <th className="px-3 py-2.5 font-medium">Minted</th>
              <th className="px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urns.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  No urn rows in the database.
                </td>
              </tr>
            ) : (
              urns.map((urn) => (
                <tr
                  key={urn.id}
                  className="border-b border-border/80 last:border-0"
                >
                  <td className="px-3 py-2.5 font-mono tabular-nums">
                    {urn.id}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-xs">
                    {urn.tba}
                  </td>
                  <td className="px-3 py-2.5">{urn.cracked ? "Yes" : "No"}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {urn._count.assets}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {urn._count.candles}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {urn.mintedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <RefreshUrnMetadataButton urnId={urn.id} />
                      <Link
                        href={`/urn/${urn.id}`}
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
