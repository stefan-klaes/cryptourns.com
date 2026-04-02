-- AlterTable (IF NOT EXISTS: safe when columns were added outside migrate history)
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "collectionName" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "name" TEXT;
