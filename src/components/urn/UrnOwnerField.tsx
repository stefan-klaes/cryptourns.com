"use client";

import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { isEqualAddress } from "@/lib/utils/isEqualAddress";
import { useAccount } from "wagmi";

type UrnOwnerFieldProps = {
  ownerAddress: string;
  ownerEnsName: string | null;
  ownerExplorerBaseUrl: string;
};

export function UrnOwnerField({
  ownerAddress,
  ownerEnsName,
  ownerExplorerBaseUrl,
}: UrnOwnerFieldProps) {
  const { address } = useAccount();
  const isYou = address != null && isEqualAddress(address, ownerAddress);

  const label =
    ownerEnsName ??
    (ownerAddress.length > 18
      ? `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`
      : ownerAddress);

  const etherscanHref = `${ownerExplorerBaseUrl}/address/${ownerAddress}`;

  return (
    <div className="relative rounded-xl border border-border bg-card/80 px-4 py-3 pr-11 shadow-sm backdrop-blur-sm">
      <a
        href={etherscanHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-2 top-2 rounded-md p-1.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="View owner on Etherscan"
      >
        <EtherscanLogo className="size-5" aria-hidden />
      </a>
      <span className="text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
        Owner
      </span>
      <p
        className="mt-1 font-mono text-sm font-medium break-all text-foreground sm:text-base"
        title={ownerAddress}
      >
        {label}
        {isYou ? " (you)" : null}
      </p>
    </div>
  );
}
