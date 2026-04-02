import { HomeExplainerVisual } from "@/components/home/HomeExplainerVisual";
import { UrnMintHeroPreview } from "@/components/urn/UrnMintHeroPreview";

function StepHeading({
  step,
  id,
  title,
}: {
  step: number;
  id: string;
  title: string;
}) {
  const label = String(step).padStart(2, "0");
  return (
    <h3
      id={id}
      className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 sm:mb-5"
    >
      <span
        className="font-mono text-3xl font-semibold tabular-nums text-primary/40 sm:text-4xl lg:text-[2.75rem] lg:leading-none"
        aria-hidden
      >
        {label}
      </span>
      <span className="max-w-[min(100%,36rem)] text-base font-semibold tracking-tight text-primary sm:text-lg">
        {title}
      </span>
    </h3>
  );
}

const detailListClass =
  "mt-6 max-w-xl space-y-2.5 text-base leading-relaxed text-muted-foreground sm:text-lg [&_strong]:font-medium [&_strong]:text-foreground";

function ExplainerPreamble() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/90 bg-gradient-to-br from-card/95 via-card to-primary/[0.09] px-8 py-11 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-11 sm:py-14 lg:px-14 lg:py-16 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/[0.12] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-48 w-[min(100%,28rem)] rounded-full bg-chart-3/[0.08] blur-3xl"
        aria-hidden
      />
      <blockquote className="relative max-w-3xl border-l-2 border-primary/35 pl-6 text-[1.125rem] leading-[1.65] text-foreground/95 sm:border-l-[3px] sm:pl-8 sm:text-[1.25rem] sm:leading-[1.62] md:text-[1.3rem] md:leading-[1.58]">
        <p className="font-medium tracking-tight text-foreground">
          We were in the Discords, the allowlists, the &ldquo;generational
          wealth&rdquo; threads. We cheered pumps and swallowed rugs. Some of
          us made it; most of us didn&apos;t.
        </p>
        <p className="mt-5 text-muted-foreground">
          The bags are still in the wallet—{" "}
          <span className="font-medium text-foreground">
            Cryptourns are for that hangover.
          </span>
        </p>
      </blockquote>
    </div>
  );
}

export function HomeCryptournsExplainer() {
  return (
    <section
      className="w-full border-t border-border/70 bg-muted/15 py-20 sm:py-24 lg:py-32"
      aria-labelledby="home-explainer-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-12">
        <header className="max-w-2xl">
          <h2
            id="home-explainer-heading"
            className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase"
          >
            How Cryptourns work
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Five steps—mint, send in, candles, crack, flex.
          </p>
        </header>

        <div className="mt-12 sm:mt-14 lg:mt-16">
          <ExplainerPreamble />
        </div>

        <div className="mt-16 space-y-20 border-t border-border/50 pt-16 sm:mt-20 sm:space-y-24 sm:pt-20 lg:mt-24 lg:space-y-32 lg:pt-24">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            The steps
          </p>

          <article
            className="max-w-3xl space-y-8 lg:space-y-10"
            aria-labelledby="explainer-mint"
          >
            <div>
              <StepHeading step={1} id="explainer-mint" title="Mint" />
              <p className="text-3xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
                Mint an urn—then make it yours.
              </p>
            </div>
            <UrnMintHeroPreview variant="featured" />
          </article>

          <article
            className="max-w-[min(100%,52rem)]"
            aria-labelledby="explainer-send-in"
          >
            <StepHeading step={2} id="explainer-send-in" title="Send in" />
            <p className="text-3xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
              Each urn has its own{" "}
              <span className="text-muted-foreground">0x…</span> wallet
              (ERC-6551).{" "}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Send NFTs or tokens
              </span>
              —that&apos;s when color and the count on the art turn on.
            </p>
          </article>

          <article
            className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20"
            aria-labelledby="explainer-candles"
          >
            <div className="order-2 lg:order-1">
              <HomeExplainerVisual variant="candles" />
            </div>
            <div className="order-1 max-w-[min(100%,52rem)] lg:order-2">
              <StepHeading step={3} id="explainer-candles" title="Candles" />
              <p className="text-3xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
                Light candles on{" "}
                <span className="text-muted-foreground">other people&apos;s</span>{" "}
                urns—respect, shade, or a quiet nod on-chain. No reply guy
                required.
              </p>
            </div>
          </article>

          <article
            className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20"
            aria-labelledby="explainer-crack"
          >
            <div className="order-2 lg:order-1">
              <HomeExplainerVisual variant="cracked" />
            </div>
            <div className="order-1 max-w-[min(100%,52rem)] lg:order-2">
              <StepHeading step={4} id="explainer-crack" title="Crack" />
              <p className="text-3xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
                When the urn&apos;s wallet{" "}
                <span className="text-muted-foreground">sends</span>{" "}
                something out—ERC-20, ERC-721, or ERC-1155—the piece can be
                marked{" "}
                <span className="text-destructive">cracked</span>: a permanent
                scar in the index that you opened the vault.
              </p>
              <ul className={detailListClass}>
                <li>
                  Indexers watch <strong>outbound transfers</strong> from the
                  token-bound address; once a send hits the chain, the cracked
                  trait reflects it.
                </li>
              </ul>
            </div>
          </article>

          <article
            className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20"
            aria-labelledby="explainer-flex"
          >
            <div className="order-1 max-w-[min(100%,52rem)] lg:order-1">
              <StepHeading step={5} id="explainer-flex" title="Flex" />
              <p className="text-3xl leading-[1.12] font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.06]">
                Time to stop hodling cope.{" "}
                <span className="text-muted-foreground">
                  Bundle the worthless stuff into an urn,
                </span>{" "}
                flex the monument, and let the chain remember you moved on.
              </p>
            </div>
            <div className="order-2 lg:order-2">
              <HomeExplainerVisual variant="closure" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
