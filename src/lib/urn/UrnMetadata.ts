/** Fixed ERC-721 `attributes` list for an urn (all traits, fixed order). */
export type UrnAttributes = [
  { trait_type: "NFTs"; value: number; display_type?: "number" },
  { trait_type: "Coins"; value: number; display_type?: "number" },
  { trait_type: "Candles"; value: number; display_type?: "number" },
  { trait_type: "Urn address"; value: string; display_type?: "string" },
  { trait_type: "Cracked"; value: string; display_type?: "string" },
];

export type UrnAttribute = UrnAttributes[number];

/** ERC-721 token metadata JSON (`name`, `description`, `image`, `attributes`) plus app fields. */
export type UrnMetadata = {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes: UrnAttributes;
};
