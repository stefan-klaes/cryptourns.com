import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { Button } from "@/components/ui/button";
import type { FeedItemPayload } from "@/lib/feed/feedCopy";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

function isHttpImageSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function FeedItem({ item }: { item: FeedItemPayload }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-md dark:ring-white/10 dark:hover:border-primary/45">
      {item.explorer ? (
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          aria-label={item.explorer.label}
          title={item.explorer.label}
          className="absolute right-2 top-2 z-10 text-muted-foreground hover:text-foreground"
          render={
            <a
              href={item.explorer.href}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <EtherscanLogo data-icon="inline-start" aria-hidden />
        </Button>
      ) : null}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        <Link
          href={item.urnHref as Route}
          className="group relative mx-auto aspect-square w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-muted/30 via-muted/45 to-muted/60 sm:mx-0 sm:w-40 sm:max-w-none"
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_50%_45%,var(--card)_0%,transparent_62%)] opacity-90 dark:opacity-75"
            aria-hidden
          />
          <div className="absolute inset-3">
            {isHttpImageSrc(item.imageSrc) ? (
              // eslint-disable-next-line @next/next/no-img-element -- NFT media from IPFS gateways / CDNs
              <img
                src={item.imageSrc}
                alt={item.imageAlt}
                className="absolute inset-0 size-full object-contain object-center transition-[filter,transform] duration-200 group-hover:scale-[1.02] group-hover:brightness-[1.04] dark:drop-shadow-[0_6px_20px_rgba(0,0,0,0.4)]"
              />
            ) : (
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                className="object-contain object-center transition-[filter,transform] duration-200 group-hover:scale-[1.02] group-hover:brightness-[1.04] dark:drop-shadow-[0_6px_20px_rgba(0,0,0,0.4)]"
                sizes="(max-width: 640px) 200px, 160px"
                unoptimized
              />
            )}
          </div>
        </Link>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-center gap-2",
            item.explorer && "sm:pr-12",
          )}
        >
          <time
            dateTime={item.occurredAtIso}
            className="text-xs font-medium text-muted-foreground"
          >
            {item.timeLabel}
          </time>
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.text}
          </p>
        </div>
      </div>
    </article>
  );
}
