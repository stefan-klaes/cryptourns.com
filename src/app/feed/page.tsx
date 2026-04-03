import { FeedItem } from "@/components/feed/FeedItem";
import { getCryptournFeed } from "@/lib/feed/getCryptournFeed";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const items = await getCryptournFeed();

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

      <div className="mx-auto max-w-xl lg:max-w-2xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Feed
          </h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Mints, vault deposits, and candles from the cemetery—newest first.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            Nothing here yet. Mint an urn, send assets to a vault, or light a
            candle to see activity.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/25 dark:ring-white/[0.06]">
            <ul className="divide-y divide-border/60">
              {items.map((item) => (
                <li key={item.key} className="px-3 sm:px-5">
                  <FeedItem item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
