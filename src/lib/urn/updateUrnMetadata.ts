import { db } from "@/lib/clients/db";
import type { Asset } from "@/lib/clients/indexer/Asset";
import { getCryptournMintDetails } from "@/lib/clients/indexer/services/getCryptournMintDetails.service";
import { getNfts } from "@/lib/clients/indexer/services/getNfts.service";
import { getTokenboundAccount } from "@/lib/clients/indexer/services/getTokenboundAccount.service";
import { isUrnCracked } from "@/lib/clients/indexer/services/isUrnCracked.service";

/**
 * Ensures a {@link Urn} row exists for the on-chain token id, fetches NFTs held by its TBA
 * from Alchemy, and replaces {@link Asset} rows for that urn (excluding ignored contracts).
 */
export async function updateUrnMetadata(urnId: number): Promise<void> {
  let urn = await getOrCreateUrn(urnId);

  if (!urn.mintTx) {
    const mint = await getCryptournMintDetails(urnId);
    if (mint) {
      urn = await db.urn.update({
        where: { id: urnId },
        data: {
          mintTx: mint.mintTx,
          mintedBy: mint.mintedBy,
          mintedAt: mint.mintedAt,
        },
      });
    }
  }

  const assets = await getNfts(urn.tba);

  const rows: (Asset & { urnId: number })[] = [];

  for (const asset of assets) {
    rows.push({ urnId: urnId, ...asset });
  }

  await db.$transaction(async (tx) => {
    await tx.asset.deleteMany({ where: { urnId: urnId } });
    if (rows.length > 0) {
      await tx.asset.createMany({ data: rows });
    }
  });

  if (urn.cracked) return;

  const cracked = await isUrnCracked(urnId);

  if (!cracked) return;

  await db.urn.update({
    where: { id: urnId },
    data: { cracked },
  });
}

async function getOrCreateUrn(urnId: number) {
  const existing = await db.urn.findUnique({ where: { id: urnId } });
  if (existing) return existing;
  return await createUrn(urnId);
}

async function createUrn(urnId: number) {
  const [tba, mint] = await Promise.all([
    getTokenboundAccount(urnId),
    getCryptournMintDetails(urnId),
  ]);

  return await db.urn.create({
    data: {
      id: urnId,
      tba,
      cracked: false,
      mintTx: mint?.mintTx ?? "",
      mintedAt: mint?.mintedAt ?? new Date(),
      mintedBy: mint?.mintedBy ?? "",
    },
  });
}
