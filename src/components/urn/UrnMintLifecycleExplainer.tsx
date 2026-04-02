import { cn } from "@/lib/utils";

export type UrnMintLifecycleExplainerProps = {
  className?: string;
  variant?: "compact" | "featured";
};

export function UrnMintLifecycleExplainer({
  className,
  variant = "compact",
}: UrnMintLifecycleExplainerProps) {
  const body =
    variant === "featured"
      ? "space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
      : "space-y-3 text-sm leading-relaxed text-muted-foreground";

  return (
    <div
      className={cn(className)}
      role="region"
      aria-label="How urns look at mint and after the first deposit"
    >
      <div className={body}>
        <p>
          <span className="font-medium text-foreground">
            At mint, every urn matches:
          </span>{" "}
          <strong className="font-medium text-foreground">grey stone</strong>, an{" "}
          <strong className="font-medium text-foreground">empty</strong> vault, and{" "}
          <strong className="font-medium text-foreground">no Roman numeral</strong> on
          the art. Same look for everyone on purpose—individuality kicks in once the
          wallet isn&apos;t empty anymore.
        </p>
        <p>
          <span className="font-medium text-foreground">
            Fund it once, and the art catches up.
          </span>{" "}
          Send the <strong className="font-medium text-foreground">first NFT or coins</strong>{" "}
          to the urn&apos;s address: the piece{" "}
          <strong className="font-medium text-foreground">gains its own colors</strong>{" "}
          from what you hold on-chain, and the{" "}
          <strong className="font-medium text-foreground">Roman numeral</strong> on the
          urn tracks{" "}
          <strong className="font-medium text-foreground">your NFT count</strong>.
          Coin balances appear in{" "}
          <strong className="font-medium text-foreground">metadata</strong> (and indexes)
          alongside the image.
        </p>
      </div>
    </div>
  );
}
