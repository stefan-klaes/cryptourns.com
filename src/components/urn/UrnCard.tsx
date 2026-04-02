import Image from "next/image";
import Link from "next/link";

export type UrnCardProps = {
  urnId: number;
  nftCount: number;
  coinCount: number;
  candleCount: number;
  cracked: boolean;
};

export function UrnCard({
  urnId,
  nftCount,
  coinCount,
  candleCount,
  cracked,
}: UrnCardProps) {
  const imageSrc = `/api/urn/${urnId}/image`;
  const title = `Cryptourn #${urnId}`;

  return (
    <Link
      href={`/urn/${urnId}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow,ring-color] duration-200 hover:border-primary/45 hover:shadow-md hover:ring-primary/25 dark:ring-white/10 dark:hover:border-primary/50 dark:hover:ring-primary/30">
        <div className="relative aspect-square bg-gradient-to-b from-muted/25 via-muted/40 to-muted/55">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,var(--card)_0%,transparent_65%)] opacity-90 dark:opacity-70"
            aria-hidden
          />
          <div className="absolute inset-5 sm:inset-6">
            <div className="relative h-full w-full">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-contain object-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-[filter] duration-200 group-hover:brightness-[1.03] dark:drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)] dark:group-hover:brightness-[1.06]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
              />
            </div>
          </div>
          {cracked ? (
            <span className="absolute top-2 right-2 rounded-full bg-destructive/90 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-destructive-foreground uppercase backdrop-blur-sm">
              Cracked
            </span>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-border/80 px-4 py-4">
          <div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>

          <dl className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-baseline gap-1">
              <dt className="sr-only">NFTs</dt>
              <dd>
                <span className="font-medium text-foreground tabular-nums">
                  {nftCount}
                </span>{" "}
                NFTs
              </dd>
            </div>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <div className="flex items-baseline gap-1">
              <dt className="sr-only">Coins</dt>
              <dd>
                <span className="font-medium text-foreground tabular-nums">
                  {coinCount}
                </span>{" "}
                coins
              </dd>
            </div>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <div className="flex items-baseline gap-1">
              <dt className="sr-only">Candles</dt>
              <dd>
                <span className="font-medium text-foreground tabular-nums">
                  {candleCount}
                </span>{" "}
                candles
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </Link>
  );
}
