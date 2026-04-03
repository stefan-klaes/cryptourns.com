"use client";

import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { CryptournLogo } from "@/components/CryptournLogo";
import { buttonVariants } from "@/components/ui/button";
import type { FeedItemPayload } from "@/lib/feed/feedCopy";
import { formatFeedTimestampAbsolute } from "@/lib/feed/formatFeedTimestamp";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";

export function FeedItem({ item }: { item: FeedItemPayload }) {
  const absoluteTime = formatFeedTimestampAbsolute(item.occurredAtIso);
  const { creator, transactionExplorer, urnId } = item;

  return (
    <article className="relative px-1 py-4 sm:px-2">
      <div className="flex gap-3 sm:gap-4">
        <Link
          href={item.urnHref as Route}
          className="block shrink-0 overflow-hidden rounded-2xl"
          aria-label={item.imageAlt}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic NFT media: app routes, IPFS, CDNs */}
          <img
            src={item.imageSrc}
            alt=""
            className="size-[6rem] object-contain object-center sm:size-[7.25rem]"
            loading="lazy"
            decoding="async"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
            {creator.addressExplorerHref ? (
              <a
                href={creator.addressExplorerHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:underline"
              >
                {creator.display}
              </a>
            ) : (
              <span className="font-semibold text-muted-foreground">
                {creator.display}
              </span>
            )}
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <time
              dateTime={item.occurredAtIso}
              title={absoluteTime}
              className="text-muted-foreground tabular-nums"
            >
              {item.timeLabel}
            </time>
          </div>

          <h2 className="mt-1 text-[0.9375rem] font-semibold leading-snug tracking-tight text-foreground sm:text-base">
            {item.headline}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {item.text}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={item.urnHref as Route}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs font-semibold tabular-nums",
              )}
              aria-label={`Open Cryptourn #${urnId}`}
              title={`Cryptourn #${urnId}`}
            >
              <span
                data-icon="inline-start"
                className="inline-flex size-3.5 shrink-0 items-center justify-center"
              >
                <CryptournLogo className="size-full" />
              </span>
              <span>#{urnId}</span>
            </Link>
            {transactionExplorer ? (
              <a
                href={transactionExplorer.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
                aria-label={transactionExplorer.label}
                title={transactionExplorer.label}
              >
                <span
                  data-icon="inline-start"
                  className="inline-flex shrink-0 items-center justify-center"
                >
                  <EtherscanLogo className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs">Tx</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
