import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeMintNudge() {
  return (
    <section
      className="border-t border-border/70 py-12 sm:py-14"
      aria-labelledby="home-mint-nudge-heading"
    >
      <div className="rounded-2xl border border-border/90 bg-card/40 px-6 py-8 text-center shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10 dark:ring-white/10">
        <h2
          id="home-mint-nudge-heading"
          className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Bundle the cope. Flex the monument.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          One urn NFT, one token-bound vault—park what you&apos;re done pretending
          is alpha, and show the piece instead.
        </p>
        <Link
          href="/mint"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-6 inline-flex w-full sm:w-auto",
          )}
        >
          Mint an urn
        </Link>
      </div>
    </section>
  );
}
