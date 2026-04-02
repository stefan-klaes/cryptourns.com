-- CreateIndex
CREATE INDEX IF NOT EXISTS "Asset_contractAddress_type_tokenId_idx" ON "Asset"("contractAddress", "type", "tokenId");
