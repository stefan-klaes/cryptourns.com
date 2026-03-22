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
      <article className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:ring-white/10 dark:hover:border-primary/35">
        <div className="relative aspect-square bg-muted/40">
          <Image
            src={imageSrc}
            alt={title}
            width={480}
            height={480}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
          {cracked ? (
            <span className="absolute top-2 right-2 rounded-full bg-destructive/90 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-destructive-foreground uppercase backdrop-blur-sm">
              Cracked
            </span>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-border/80 px-4 py-4">
          <div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
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
