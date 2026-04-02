import { db } from "@/lib/clients/db";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import { toUrnMetadata, urnListInclude } from "@/lib/urn/toUrnMetadata";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

export type UrnMetadataWithTba = {
  metadata: UrnMetadata;
  tba: Address;
  /** Same as Candles trait; explicit for client props without parsing attributes. */
  candleCount: number;
};

/**
 * Builds ERC-721 metadata for an urn from the database, or `null` if it does not exist.
 * `image` is a relative path; prefix with your site origin when exposing `tokenURI`.
 */
export async function getUrnMetadata(
  urnId: number,
): Promise<UrnMetadataWithTba | null> {
  const urn = await db.urn.findUnique({
    where: { id: urnId },
    include: urnListInclude,
  });

  if (!urn) return null;

  if (!isAddress(urn.tba)) {
    throw new Error(`Invalid TBA address stored for urn ${urnId}`);
  }

  return {
    metadata: toUrnMetadata(urn),
    tba: getAddress(urn.tba),
    candleCount: urn._count.candles,
  };
}
