"use client";

import { isEqualAddress } from "@/lib/utils/isEqualAddress";
import { useAccount } from "wagmi";

type UrnOwnerBylineProps = {
  ownerAddress: string;
  ownerEnsName: string | null;
  ownerExplorerBaseUrl: string;
};

export function UrnOwnerByline({
  ownerAddress,
  ownerEnsName,
  ownerExplorerBaseUrl,
}: UrnOwnerBylineProps) {
  const { address } = useAccount();
  const isYou = address != null && isEqualAddress(address, ownerAddress);

  const label =
    ownerEnsName ??
    (ownerAddress.length > 18
      ? `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`
      : ownerAddress);

  const href = `${ownerExplorerBaseUrl}/address/${ownerAddress}`;

  return (
    <span className="shrink-0 text-right text-sm text-muted-foreground">
      <span className="text-muted-foreground/90">owned by</span>{" "}
      {isYou ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-foreground/35 underline-offset-[3px] transition-colors hover:decoration-foreground"
          title={ownerAddress}
        >
          you
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-medium text-foreground underline decoration-foreground/35 underline-offset-[3px] transition-colors hover:decoration-foreground"
          title={ownerAddress}
        >
          {label}
        </a>
      )}
    </span>
  );
}
