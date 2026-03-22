import type { UrnAttribute, UrnMetadata } from "@/lib/urn/UrnMetadata";
import Image from "next/image";
import Link from "next/link";

function formatTraitDisplay(attr: UrnAttribute): { short: string; full: string } {
  if (typeof attr.value === "number") {
    const s = attr.value.toLocaleString();
    return { short: s, full: s };
  }
  const s = attr.value;
  if (attr.trait_type === "Urn address" && s.startsWith("0x") && s.length > 18) {
    return {
      short: `${s.slice(0, 6)}…${s.slice(-4)}`,
      full: s,
    };
  }
  return { short: s, full: s };
}

type UrnNftDetailProps = {
  urnId: number;
  metadata: UrnMetadata;
};

export function UrnNftDetail({ urnId, metadata }: UrnNftDetailProps) {
  const { image, name, description, attributes } = metadata;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[420px] w-[70%] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[380px] w-[60%] rounded-full bg-chart-2/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link
            href="/urns"
            className="transition-colors hover:text-foreground"
          >
            Urns
          </Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">{name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <div className="aspect-square bg-muted/30">
                <Image
                  src={image}
                  alt={name}
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground lg:text-left">
              Renders the same URI as ERC-721 metadata{" "}
              <span className="font-mono text-[0.7rem] text-foreground/80">
                {image}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <header className="space-y-3">
              <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Cryptourns
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {name}
              </h1>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                Token #{urnId}
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Traits
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {attributes.map((attr) => {
                  const { short, full } = formatTraitDisplay(attr);
                  const isCrackedYes =
                    attr.trait_type === "Cracked" && attr.value === "Yes";
                  return (
                    <li key={attr.trait_type}>
                      <div
                        className="flex h-full flex-col rounded-xl border border-border bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
                        title={full !== short ? full : undefined}
                      >
                        <span className="text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                          {attr.trait_type}
                        </span>
                        <span
                          className={`mt-1 font-mono text-sm font-medium break-all sm:text-base ${
                            isCrackedYes
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          {short}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
