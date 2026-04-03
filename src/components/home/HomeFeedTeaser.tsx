import { FeedItem } from "@/components/feed/FeedItem";
import type { FeedItemPayload } from "@/lib/feed/feedCopy";
import Link from "next/link";

export type HomeFeedTeaserProps = {
  items: FeedItemPayload[];
};

export function HomeFeedTeaser({ items }: HomeFeedTeaserProps) {
  return (
    <section
      className="border-t border-border/70 py-14 sm:py-16"
      aria-labelledby="home-feed-teaser-heading"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2
            id="home-feed-teaser-heading"
            className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase"
          >
            Cemetery pulse
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Recent mints, assets sent to urns, and candles—newest first.
          </p>
        </div>
        {items.length > 0 ? (
          <Link
            href="/feed"
            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Open feed
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Mint an urn, send assets to a vault, or light a
            candle to see activity.
          </p>
          <p className="mt-4">
            <Link
              href="/mint"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Mint an urn
            </Link>
          </p>
        </div>
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
    </section>
  );
}
