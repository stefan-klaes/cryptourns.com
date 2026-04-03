import { AssetType } from "@/generated/prisma";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { UrnIndexedAssetRow } from "@/lib/urn/getUrnIndexedAssets";
import { getAddress } from "viem";

/** True when this indexed row is the Cryptourn NFT for `urnId` (cannot leave its own TBA). */
export function isVaultCryptournSelfAsset(
  urnId: number,
  row: UrnIndexedAssetRow,
): boolean {
  if (row.type === AssetType.ERC20) return false;
  try {
    return (
      getAddress(row.contractAddress) ===
        getAddress(CRYPTOURNS_CONTRACT.address) &&
      BigInt(row.tokenId) === BigInt(urnId)
    );
  } catch {
    return false;
  }
}
