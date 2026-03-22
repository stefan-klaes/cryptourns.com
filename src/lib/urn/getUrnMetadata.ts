import { db } from "@/lib/clients/db";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import { toUrnMetadata, urnListInclude } from "@/lib/urn/toUrnMetadata";

/**
 * Builds ERC-721 metadata for an urn from the database, or `null` if it does not exist.
 * `image` is a relative path; prefix with your site origin when exposing `tokenURI`.
 */
export async function getUrnMetadata(
  urnId: number,
): Promise<UrnMetadata | null> {
  const urn = await db.urn.findUnique({
    where: { id: urnId },
    include: urnListInclude,
  });

  if (!urn) return null;

  return toUrnMetadata(urn);
}
