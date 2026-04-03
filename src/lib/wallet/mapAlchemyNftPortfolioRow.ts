import type { AlchemyNftPortfolioRow } from "@/lib/clients/indexer/alchemy/alchemyNftPortfolio";
import type { NftPortfolioItemJson } from "@/lib/wallet/portfolioTypes";

export function mapAlchemyNftPortfolioRow(
  r: AlchemyNftPortfolioRow,
): NftPortfolioItemJson {
  return {
    contractAddress: r.contractAddress,
    tokenId: r.tokenId,
    standard: r.standard,
    name: r.name,
    image: r.image,
    collectionName: r.collectionName,
    balance: r.standard === "ERC1155" ? String(r.quantity) : "1",
  };
}
