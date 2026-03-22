import { db } from "@/lib/clients/db";
import type { Asset } from "@/lib/clients/indexer/Asset";
import { getNfts } from "@/lib/clients/indexer/services/getNfts.service";
import { getTokenboundAccount } from "@/lib/clients/indexer/services/getTokenboundAccount.service";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";

/**
 * Ensures a {@link Urn} row exists for the on-chain token id, fetches NFTs held by its TBA
 * from Alchemy, and replaces {@link Asset} rows for that urn (excluding ignored contracts).
 */
export async function updateUrnMetadata(urnId: number): Promise<void> {
  const tba = await getTokenboundAccount(urnId);
  const assets = await getNfts(tba);

  const rows: (Asset & { urnId: number })[] = [];

  for (const asset of assets) {
    if (asset.contractAddress === CRYPTOURNS_CONTRACT.address.toLowerCase())
      continue;
    rows.push({ urnId: urnId, ...asset });
  }

  await db.$transaction(async (tx) => {
    await tx.urn.upsert({
      where: { id: urnId },
      create: { id: urnId, tba, cracked: false },
      update: { tba },
    });
    await tx.asset.deleteMany({ where: { urnId: urnId } });
    if (rows.length > 0) {
      await tx.asset.createMany({ data: rows });
    }
  });
}
