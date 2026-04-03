import { AssetType } from "@/generated/prisma";
import { getNftMetadataDisplayAlchemy } from "@/lib/clients/indexer/alchemy/nftMetadata";
import { displayableNftImageUrl } from "@/lib/wallet/displayableNftImageUrl";

type AssetRowForImage = {
  contractAddress: string;
  tokenId: string;
  type: AssetType;
  imageUrl: string | null;
};

export async function resolveAssetFeedImageUrl(
  row: AssetRowForImage,
): Promise<string | null> {
  const fromDb = displayableNftImageUrl(row.imageUrl?.trim() ?? null);
  if (fromDb) return fromDb;
  if (row.type !== AssetType.ERC721 && row.type !== AssetType.ERC1155) {
    return null;
  }
  try {
    const meta = await getNftMetadataDisplayAlchemy(
      row.contractAddress,
      row.tokenId,
      row.type,
    );
    return displayableNftImageUrl(meta.image?.trim() ?? null);
  } catch {
    return null;
  }
}
