-- Reset all urn rows (and dependent Candle / Asset rows via FK cascade)
TRUNCATE TABLE "Urn" CASCADE;

-- Require mint provenance on Urn
ALTER TABLE "Urn" ALTER COLUMN "mintTx" SET NOT NULL;
ALTER TABLE "Urn" ALTER COLUMN "mintedAt" SET NOT NULL;
ALTER TABLE "Urn" ALTER COLUMN "mintedBy" SET NOT NULL;
