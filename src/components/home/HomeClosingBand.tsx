import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Route } from "next";

export function HomeClosingBand() {
  return (
    <section
      className="w-full border-t border-border/70 bg-muted/20 py-16 sm:py-20"
      aria-labelledby="home-closing-heading"
    >
      <div className="mx-auto max-w-2xl px-6 text-center sm:px-10 lg:px-12">
        <h2
          id="home-closing-heading"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Ready to bury the bags?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Mint an urn, route the cope into its vault, and flex the monument—the
          chain remembers what you parked inside.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/mint"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            Mint an urn
          </Link>
          <Link
            href="/whitepaper"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto",
            )}
          >
            Read the paper
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Share mints with a referral link—see rules and claim on{" "}
          <Link
            href={"/earn" as Route}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Earn
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
