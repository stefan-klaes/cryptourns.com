import type { ReactNode } from "react";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const toc = [
  { href: "#abstract", label: "Abstract" },
  { href: "#problem", label: "The problem" },
  { href: "#what-is-a-cryptourn", label: "What is a Cryptourn" },
  { href: "#lifecycle", label: "Lifecycle" },
  { href: "#art-and-metadata", label: "Art and metadata" },
  { href: "#candles", label: "Candles" },
  { href: "#cracked", label: "Cracked" },
  { href: "#collections-and-feed", label: "Collections and feed" },
  { href: "#minting-and-referrals", label: "Minting and referrals" },
  { href: "#system-overview", label: "System overview" },
  { href: "#risks", label: "Risks and disclaimers" },
] as const;

function TocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="block rounded-md py-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

function SectionTitle({
  id,
  children,
  as: Tag = "h2",
}: {
  id: string;
  children: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "scroll-mt-[calc(5.5rem+env(safe-area-inset-top))] font-semibold tracking-tight text-foreground md:scroll-mt-28",
        Tag === "h2" ? "text-xl sm:text-2xl" : "text-lg",
      )}
    >
      {children}
    </Tag>
  );
}

function Body({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]", className)}>
      {children}
    </div>
  );
}

export function WhitepaperPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[280px] w-[55%] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/3 -right-1/4 h-[240px] w-[45%] rounded-full bg-chart-3/10 blur-3xl" />
      </div>

      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[13rem_minmax(0,1fr)] xl:gap-16">
        <aside className="mb-10 lg:mb-0">
          <nav
            aria-label="On this page"
            className="rounded-xl border border-border/80 bg-card/30 p-4 lg:sticky lg:top-28 lg:border-0 lg:bg-transparent lg:p-0"
          >
            <p className="mb-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              On this page
            </p>
            <ul className="space-y-0.5">
              {toc.map(({ href, label }) => (
                <li key={href}>
                  <TocLink href={href}>{label}</TocLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 max-w-2xl">
          <header className="mb-10 space-y-3">
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Documentation
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Cryptourns whitepaper
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              A final resting place for the NFTs and coins you do not want to pretend are
              valuable anymore—bundle them into an on-chain urn, let them rest, and flex the
              monument instead.
            </p>
          </header>

          <div className="space-y-12">
            <section aria-labelledby="abstract-heading" className="space-y-4">
              <SectionTitle id="abstract">Abstract</SectionTitle>
              <div className="border-l-2 border-primary/30 pl-5">
                <p className="text-sm font-medium leading-relaxed text-foreground sm:text-base">
                  Cryptourns turns wallet clutter into a single collectible: each urn is an NFT
                  with its own token-bound account (ERC-6551). You send floor JPEGs, rugged
                  tokens, and dust into that address—the chain remembers what is inside, the art
                  reflects it, and the urn becomes the flex.
                </p>
              </div>
            </section>

            <Separator />

            <section aria-labelledby="problem-heading" className="space-y-4">
              <SectionTitle id="problem">The problem</SectionTitle>
              <Body>
                <p>
                  Most of us have been in the Discords, the allowlists, the &ldquo;generational
                  wealth&rdquo; threads. Some positions worked; many did not. The bags are still
                  in the wallet—unwanted NFTs, coins too small to bother selling, reminders you
                  do not need on your PnL screen every day.
                </p>
                <p>
                  Cryptourns is for that hangover: a deliberate place to park what you are done
                  pretending to moon, without pretending you never bought it. You bury the bags
                  nobody wants and move the story to something you actually want to show—the urn.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="what-is-a-cryptourn-heading" className="space-y-4">
              <SectionTitle id="what-is-a-cryptourn">What is a Cryptourn</SectionTitle>
              <Body>
                <p>
                  A Cryptourn is an on-chain urn NFT. Each token has a deterministic{" "}
                  <span className="font-medium text-foreground">token-bound address</span>{" "}
                  (ERC-6551)—its own <span className="font-mono text-foreground/90">0x…</span>{" "}
                  wallet. You control the urn NFT; assets you send to that address live in the
                  vault associated with that urn.
                </p>
                <p>
                  The product surface is built so you can{" "}
                  <span className="font-medium text-foreground">
                    ship NFTs and coins into the urn
                  </span>
                  , participate socially with{" "}
                  <span className="font-medium text-foreground">candles</span>, and browse what
                  the ecosystem has parked on-chain via{" "}
                  <Link href="/collections" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Collections
                  </Link>{" "}
                  and the{" "}
                  <Link href="/feed" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Feed
                  </Link>
                  .
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="lifecycle-heading" className="space-y-6">
              <SectionTitle id="lifecycle">Lifecycle</SectionTitle>
              <Body>
                <p>
                  End to end, Cryptourns follows five ideas—mint, send in, candles, crack, flex—the
                  same story as the{" "}
                  <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
                    homepage
                  </Link>
                  .
                </p>
              </Body>

              <div className="space-y-8 border-l border-border/80 pl-5 sm:pl-6">
                <div className="space-y-2">
                  <SectionTitle as="h3" id="lifecycle-mint">
                    1. Mint
                  </SectionTitle>
                  <Body>
                    <p>
                      You mint an urn to your wallet or gift it to others from the{" "}
                      <Link href="/mint" className="font-medium text-foreground underline-offset-4 hover:underline">
                        mint
                      </Link>{" "}
                      flow. Supply is visible on-chain; when minting is paused, the contract
                      enforces it.
                    </p>
                  </Body>
                </div>

                <div className="space-y-2">
                  <SectionTitle as="h3" id="lifecycle-send-in">
                    2. Send in
                  </SectionTitle>
                  <Body>
                    <p>
                      Transfer ERC-20, ERC-721, or ERC-1155 assets to the urn&apos;s token-bound
                      address. That is when the piece starts reflecting reality on-chain: color and
                      counts on the art catch up to what the vault holds.
                    </p>
                  </Body>
                </div>

                <div className="space-y-2">
                  <SectionTitle as="h3" id="lifecycle-candles">
                    3. Candles
                  </SectionTitle>
                  <Body>
                    <p>
                      Anyone can light candles on{" "}
                      <span className="font-medium text-foreground">other people&apos;s</span> urns—
                      respect, shade, or a quiet nod on-chain without a reply guy.
                    </p>
                  </Body>
                </div>

                <div className="space-y-2">
                  <SectionTitle as="h3" id="lifecycle-crack">
                    4. Crack
                  </SectionTitle>
                  <Body>
                    <p>
                      When the urn&apos;s wallet <span className="font-medium text-foreground">sends</span>{" "}
                      something out—ERC-20, ERC-721, or ERC-1155—the piece can be marked{" "}
                      <span className="font-medium text-destructive">cracked</span>: a permanent
                      signal in the index that the vault was opened from the inside.
                    </p>
                    <p>
                      Indexers watch outbound transfers from the token-bound address; once a send
                      hits the chain, the cracked trait reflects it.
                    </p>
                  </Body>
                </div>

                <div className="space-y-2">
                  <SectionTitle as="h3" id="lifecycle-flex">
                    5. Flex
                  </SectionTitle>
                  <Body>
                    <p>
                      Stop hodling cope as a scattered wallet. Bundle the worthless stuff into an
                      urn, flex the monument, and let the chain remember you moved on.
                    </p>
                  </Body>
                </div>
              </div>
            </section>

            <Separator />

            <section aria-labelledby="art-and-metadata-heading" className="space-y-4">
              <SectionTitle id="art-and-metadata">Art and metadata</SectionTitle>
              <Body>
                <p>
                  <span className="font-medium text-foreground">At mint, every urn matches:</span>{" "}
                  grey stone, an empty vault, and no Roman numeral on the art. The same baseline
                  for everyone on purpose—individuality shows up once the wallet is not empty.
                </p>
                <p>
                  <span className="font-medium text-foreground">After the first deposit:</span> send
                  the first NFT or coins to the urn&apos;s address and the piece gains its own
                  colors from what you hold on-chain. The Roman numeral on the urn tracks your NFT
                  count. Coin balances show up in metadata (and indexes) alongside the image.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="candles-heading" className="space-y-4">
              <SectionTitle id="candles">Candles</SectionTitle>
              <Body>
                <p>
                  Candles are an on-chain social layer on urns you do not own. They show up in
                  activity feeds and in the urn&apos;s story without needing an off-chain thread.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="cracked-heading" className="space-y-4">
              <SectionTitle id="cracked">Cracked</SectionTitle>
              <Body>
                <p>
                  &ldquo;Cracked&rdquo; is not a punishment aesthetic—it is transparency. If assets
                  leave the token-bound account, the index records that the vault was drained or
                  partially emptied. Collectors can read that scar as part of the urn&apos;s
                  history.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="collections-and-feed-heading" className="space-y-4">
              <SectionTitle id="collections-and-feed">Collections and feed</SectionTitle>
              <Body>
                <p>
                  <Link href="/collections" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Collections
                  </Link>{" "}
                  is a catalog of contracts and assets that appear inside urns—JPEGs, editions,
                  coins, whatever the vaults hold—and which urns hold each line. It answers: what got
                  buried, and where.
                </p>
                <p>
                  The{" "}
                  <Link href="/feed" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Feed
                  </Link>{" "}
                  lists recent mints, assets sent to urns, and candles, newest first—surface-level
                  pulse of the cemetery.
                </p>
                <p>
                  Browse individual urns from{" "}
                  <Link href="/urns" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Urns
                  </Link>
                  .
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="minting-and-referrals-heading" className="space-y-4">
              <SectionTitle id="minting-and-referrals">Minting and referrals</SectionTitle>
              <Body>
                <p>
                  Minting happens through the app against the on-chain Cryptourns contract. You can
                  route a referral via a mint link; when a referral is active, the contract allocates
                  a referrer share of qualifying mints according to rules enforced on-chain.
                </p>
                <p>
                  Referrers accrue balances and claim in the app on the configured chain. The
                  default referral share and any custom assignment are defined by the contract—see
                  the live value on the{" "}
                  <Link href="/earn" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Earn
                  </Link>{" "}
                  page. If you mint using your own referral link, the contract does not pay you a
                  referral on that transaction: minter and referrer cannot be the same wallet for
                  that payout.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="system-overview-heading" className="space-y-4">
              <SectionTitle id="system-overview">System overview</SectionTitle>
              <Body>
                <p>
                  Cryptourns combines an NFT contract and ERC-6551 token-bound accounts, a web app
                  for minting and browsing, and indexed data stored off-chain (for example in
                  Postgres) so the UI can show aggregates, feeds, and collection views without
                  walking every transfer by hand in the browser.
                </p>
                <p>
                  Wallets connect via standard Web3 tooling; reads and writes go to the deployed
                  contracts on the supported chain.
                </p>
              </Body>
            </section>

            <Separator />

            <section aria-labelledby="risks-heading" className="space-y-4">
              <SectionTitle id="risks">Risks and disclaimers</SectionTitle>
              <Body>
                <ul className="list-inside list-disc space-y-2 marker:text-muted-foreground">
                  <li>
                    Transfers into an urn&apos;s token-bound address are ordinary on-chain sends.
                    Treat addresses carefully; mistaken sends may be irreversible.
                  </li>
                  <li>
                    Smart contracts and bridges carry execution and upgrade risk depending on how
                    they are deployed and governed. Do your own research.
                  </li>
                  <li>
                    Indexing and UI data can lag the chain or disagree during reorgs or incidents;
                    the canonical state is on-chain.
                  </li>
                  <li>
                    This document is informational, not investment, tax, or legal advice. Nothing
                    here promises returns or utility for any token or NFT.
                  </li>
                </ul>
              </Body>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
