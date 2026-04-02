import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import { mapAlchemyNftPortfolioRow } from "@/lib/wallet/mapAlchemyNftPortfolioRow";
import type {
  NftPortfolioItemJson,
  OwnedCryptournsResponse,
} from "@/lib/wallet/portfolioTypes";
import type { Address } from "viem";

function sortByTokenId(items: NftPortfolioItemJson[]) {
  return [...items].sort((a, b) => {
    const na = BigInt(a.tokenId);
    const nb = BigInt(b.tokenId);
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  });
}

/** Cryptourns NFTs for `owner` via a single contract-filtered Alchemy `getNFTs` flow. */
export async function getOwnedCryptournsForWallet(
  owner: Address,
): Promise<OwnedCryptournsResponse> {
  const alchemy = new AlchemyProvider();
  const rows = await alchemy.getCryptournsNftsForOwner(owner);
  const enriched = await alchemy.enrichPortfolioRowsIfSparse(rows);
  const cryptourns = sortByTokenId(
    enriched
      .filter((r) => r.standard === "ERC721")
      .map(mapAlchemyNftPortfolioRow),
  );

  return {
    chainId: getCryptournsChainConfig().chainId,
    cryptourns,
  };
}
