import { AssetTransferDirection } from "@/generated/prisma";
import { db } from "@/lib/clients/db";
import type { Asset } from "@/lib/clients/indexer/Asset";
import { getCryptournMintDetails } from "@/lib/clients/indexer/services/getCryptournMintDetails";
import { getNfts } from "@/lib/clients/indexer/services/getNfts";
import { getTokenboundAccount } from "@/lib/clients/indexer/services/getTokenboundAccount";
import {
  loadNewUrnAssetTransfersForPersist,
  persistUrnAssetTransferRows,
} from "@/lib/urn/ingestUrnAssetTransfersFromAlchemy";
import { getAddress, type Address } from "viem";

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

  let transferSync: Awaited<
    ReturnType<typeof loadNewUrnAssetTransfersForPersist>
  > | null = null;
  try {
    transferSync = await loadNewUrnAssetTransfersForPersist(
      urnId,
      getAddress(urn.tba as Address),
      urn.assetTransfersSyncedThroughBlock,
    );
  } catch (err) {
    console.error(`[urn] asset transfer sync failed for #${urnId}:`, err);
  }

  await db.$transaction(async (tx) => {
    await tx.asset.deleteMany({ where: { urnId: urnId } });
    if (rows.length > 0) {
      await tx.asset.createMany({ data: rows });
    }
    if (transferSync) {
      await persistUrnAssetTransferRows(
        tx,
        transferSync.rows,
        transferSync.nextWatermark,
        urnId,
      );
    }
  });

  if (urn.cracked) return;

  const hasOutbound = await db.urnAssetTransfer.findFirst({
    where: { urnId, direction: AssetTransferDirection.OUT },
    select: { id: true },
  });

  if (!hasOutbound) return;

  await db.urn.update({
    where: { id: urnId },
    data: { cracked: true },
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
