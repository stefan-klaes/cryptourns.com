/** Full portfolio from `fetchWalletPortfolio` / `getWalletPortfolio`. */
export type WalletPortfolioResponse = {
  chainId: number;
  erc20: Erc20PortfolioItemJson[];
  /** ERC-721 and ERC-1155 combined for UI lists. */
  nfts: NftPortfolioItemJson[];
};

/** Alchemy Cryptourns-contract pass only (no full-wallet NFT scan). */
export type OwnedCryptournsResponse = {
  chainId: number;
  cryptourns: NftPortfolioItemJson[];
};

export type Erc20PortfolioItemJson = {
  contractAddress: `0x${string}`;
  /** uint256 balance as decimal string */
  balanceRaw: string;
  decimals: number;
  symbol: string;
  name: string | null;
};

export type NftPortfolioItemJson = {
  contractAddress: `0x${string}`;
  tokenId: string;
  standard: "ERC721" | "ERC1155";
  /** Token display name from metadata when available. */
  name: string | null;
  /** Resolved image URL (http(s), ipfs, or data) when available. */
  image: string | null;
  /** Collection / contract display name from Alchemy when available. */
  collectionName: string | null;
  /** ERC-1155 balance as decimal string; `"1"` for ERC-721 */
  balance: string;
};
