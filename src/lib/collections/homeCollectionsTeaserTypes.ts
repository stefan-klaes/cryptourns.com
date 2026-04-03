export type HomeCollectionsAggregates = {
  totalPieces: number;
  urnsWithAssets: number;
  contractCount: number;
};

export type HomeCollectionTeaserRow = {
  contractAddress: string;
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
  totalIndexedQuantity: number;
  inUrnsCount: number;
};
