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

      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Recent mints, assets sent to urns, and candles — newest first.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            Nothing here yet. Mint an urn, send assets to a vault, or light a
            candle to see activity.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.key}>
                <FeedItem item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
