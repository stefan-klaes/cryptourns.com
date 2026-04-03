export type RawAlchemyMedia = {
  gateway?: string;
  raw?: string;
  thumbnail?: string;
  format?: string;
};

export type RawAlchemyContract = {
  address?: string;
  name?: string;
  symbol?: string;
  openSea?: { collectionName?: string };
};

export type RawAlchemyOwnedNft = {
  contract?: RawAlchemyContract;
  id?: { tokenId?: string };
  tokenType?: string;
  balance?: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string | Record<string, unknown>;
  media?: RawAlchemyMedia[];
  metadata?: Record<string, unknown>;
  /** Sometimes a stringified JSON object from Alchemy. */
  rawMetadata?: unknown;
  /** Present when getNFTs uses `orderBy=transferTime`. */
  acquiredAt?: {
    blockTimestamp?: string | number;
    blockNumber?: string;
  };
};
