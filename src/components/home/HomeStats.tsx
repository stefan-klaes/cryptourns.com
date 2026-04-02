import type { HomeStatsSnapshot } from "@/lib/home/getHomeStats";

export type HomeStatsProps = {
  stats: HomeStatsSnapshot;
};

function formatCount(n: number): string {
  return n.toLocaleString();
}

export function HomeStats({ stats }: HomeStatsProps) {
  const items = [
    {
      label: "Minted urns",
      value:
        stats.totalMinted != null ? (
          formatCount(stats.totalMinted)
        ) : (
          <span className="text-base font-normal text-muted-foreground">
            Unavailable
          </span>
        ),
    },
    {
      label: "Coins in urns",
      value: formatCount(stats.coinsInUrns),
    },
    {
      label: "NFTs in urns",
      value: formatCount(stats.nftsInUrns),
    },
    {
      label: "Lighted candles",
      value: formatCount(stats.lightedCandles),
    },
  ] as const;

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card/40 px-4 py-3"
        >
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
