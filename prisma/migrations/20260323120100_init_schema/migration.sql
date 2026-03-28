-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ERC721', 'ERC1155', 'ERC20');

-- CreateTable
CREATE TABLE "Candle" (
    "urnId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("urnId","address")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "urnId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Urn" (
    "id" INTEGER NOT NULL,
    "tba" TEXT NOT NULL,
    "cracked" BOOLEAN NOT NULL DEFAULT false,
    "mintTx" TEXT,
    "mintedAt" TIMESTAMP(3),
    "mintedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Urn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Candle_urnId_idx" ON "Candle"("urnId");

-- CreateIndex
CREATE INDEX "Asset_urnId_idx" ON "Asset"("urnId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_urnId_contractAddress_tokenId_key" ON "Asset"("urnId", "contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Urn_tba_key" ON "Urn"("tba");

-- AddForeignKey
ALTER TABLE "Candle" ADD CONSTRAINT "Candle_urnId_fkey" FOREIGN KEY ("urnId") REFERENCES "Urn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_urnId_fkey" FOREIGN KEY ("urnId") REFERENCES "Urn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
