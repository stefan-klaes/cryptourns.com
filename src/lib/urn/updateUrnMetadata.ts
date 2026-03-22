import { db } from "@/lib/clients/db";
import type { Asset } from "@/lib/clients/indexer/Asset";
import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { ViemProvider } from "@/lib/contract/ViemProvider";

/**
 * Ensures a {@link Urn} row exists for the on-chain token id, fetches NFTs held by its TBA
 * from Alchemy, and replaces {@link Asset} rows for that urn (excluding ignored contracts).
 */
export async function updateUrnMetadata(urnId: number): Promise<void> {
  const viem = new ViemProvider();
  const tba = await viem.getTokenboundAccount(urnId);

  const alchemy = new AlchemyProvider();
  const assets = await alchemy.getAllNftsForOwner(tba);

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
