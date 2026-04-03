-- CreateEnum
CREATE TYPE "AssetTransferDirection" AS ENUM ('IN', 'OUT');

-- AlterTable
ALTER TABLE "Urn" ADD COLUMN "assetTransfersSyncedThroughBlock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UrnAssetTransfer" (
    "id" SERIAL NOT NULL,
    "urnId" INTEGER NOT NULL,
    "direction" "AssetTransferDirection" NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "quantityRaw" TEXT NOT NULL,
    "quantityDisplay" TEXT,
    "assetSymbol" TEXT,
    "decimals" INTEGER,
    "name" TEXT,
    "imageUrl" TEXT,
    "collectionName" TEXT,
    "alchemyUniqueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UrnAssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UrnAssetTransfer_urnId_txHash_logIndex_contractAddress_tokenId_direction_key" ON "UrnAssetTransfer"("urnId", "txHash", "logIndex", "contractAddress", "tokenId", "direction");

-- CreateIndex
CREATE INDEX "UrnAssetTransfer_urnId_occurredAt_idx" ON "UrnAssetTransfer"("urnId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "UrnAssetTransfer_urnId_blockNumber_idx" ON "UrnAssetTransfer"("urnId", "blockNumber");

-- AddForeignKey
ALTER TABLE "UrnAssetTransfer" ADD CONSTRAINT "UrnAssetTransfer_urnId_fkey" FOREIGN KEY ("urnId") REFERENCES "Urn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
