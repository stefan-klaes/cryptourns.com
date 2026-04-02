import { AssetType } from "@/generated/prisma";
import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import { displayableNftImageUrl } from "@/lib/wallet/displayableNftImageUrl";

export function tryCreateAlchemyProvider(): AlchemyProvider | null {
  try {
    return new AlchemyProvider();
  } catch {
    return null;
  }
}

type AssetRowForImage = {
  contractAddress: string;
  tokenId: string;
  type: AssetType;
  imageUrl: string | null;
};

export async function resolveAssetFeedImageUrl(
  row: AssetRowForImage,
  alchemy: AlchemyProvider | null,
): Promise<string | null> {
  const fromDb = displayableNftImageUrl(row.imageUrl?.trim() ?? null);
  if (fromDb) return fromDb;
  if (
    !alchemy ||
    (row.type !== AssetType.ERC721 && row.type !== AssetType.ERC1155)
  ) {
    return null;
  }
  const meta = await alchemy.getNftMetadataDisplay(
    row.contractAddress,
    row.tokenId,
    row.type,
  );
  return displayableNftImageUrl(meta.image?.trim() ?? null);
}
