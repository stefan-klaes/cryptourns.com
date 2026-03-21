import { EthereumLogo } from "@/components/brand-icons";
import { formatEthereum } from "@/lib/utils/formatEthereum";

type PriceSummaryProps = {
  pricePerUnit: bigint;
  formattedPrice: string;
  count: number;
};

export function PriceSummary({
  pricePerUnit,
  formattedPrice,
  count,
}: PriceSummaryProps) {
  const total = pricePerUnit * BigInt(count);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Price per urn</span>
        <span className="flex items-center gap-1.5 font-medium tabular-nums text-foreground">
          <EthereumLogo aria-hidden className="size-3.5 shrink-0 fill-current" />
          {formattedPrice} ETH
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Quantity</span>
        <span className="font-medium tabular-nums text-foreground">
          {count}
        </span>
      </div>
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
            <EthereumLogo aria-hidden className="size-3.5 shrink-0 fill-current" />
            {formatEthereum(total, 2)} ETH
          </span>
        </div>
      </div>
    </div>
  );
}
