import { getAddress, isAddress } from "viem";

/** Contract / collection page on the chain explorer. */
export function explorerHrefForCollection(
  explorerBaseUrl: string,
  contractAddress: string,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = isAddress(contractAddress)
    ? getAddress(contractAddress)
    : contractAddress;
  return `${base}/address/${contract}`;
}
