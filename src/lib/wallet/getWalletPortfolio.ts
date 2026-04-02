import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { AlchemyProvider } from "@/lib/clients/indexer/AlchemyProvider";
import { getCryptournsPublicClient } from "@/lib/clients/rpc/cryptournsPublicClient";
import { mapAlchemyNftPortfolioRow } from "@/lib/wallet/mapAlchemyNftPortfolioRow";
import type {
  Erc20PortfolioItemJson,
  WalletPortfolioResponse,
} from "@/lib/wallet/portfolioTypes";
import { type Address, parseAbi } from "viem";

const erc20MetaAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]);

const ERC20_META_BATCH = 40;

async function enrichErc20Rows(
  rows: { contractAddress: Address; balanceRaw: bigint }[],
): Promise<Erc20PortfolioItemJson[]> {
  if (rows.length === 0) return [];

  const client = getCryptournsPublicClient();
  const out: Erc20PortfolioItemJson[] = [];

  for (let i = 0; i < rows.length; i += ERC20_META_BATCH) {
    const batch = rows.slice(i, i + ERC20_META_BATCH);
    const contracts = batch.flatMap((b) => [
      {
        address: b.contractAddress,
        abi: erc20MetaAbi,
        functionName: "decimals" as const,
      },
      {
        address: b.contractAddress,
        abi: erc20MetaAbi,
        functionName: "symbol" as const,
      },
      {
        address: b.contractAddress,
        abi: erc20MetaAbi,
        functionName: "name" as const,
      },
    ]);

    const results = await client.multicall({ contracts, allowFailure: true });

    for (let j = 0; j < batch.length; j++) {
      const dec = results[j * 3];
      const sym = results[j * 3 + 1];
      const nam = results[j * 3 + 2];
      if (dec.status !== "success") continue;
      const decimals = Number(dec.result);
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
        continue;
      }

      let symbol = "?";
      if (sym.status === "success" && typeof sym.result === "string") {
        symbol = sym.result;
      }

      let name: string | null = null;
      if (nam.status === "success" && typeof nam.result === "string") {
        name = nam.result;
      }

      const b = batch[j];
      if (!b) continue;

      out.push({
        contractAddress: b.contractAddress,
        balanceRaw: b.balanceRaw.toString(),
        decimals,
        symbol: symbol.slice(0, 32),
        name: name ? name.slice(0, 200) : null,
      });
    }
  }

  return out;
}

export async function getWalletPortfolio(
  owner: Address,
): Promise<WalletPortfolioResponse> {
  const alchemy = new AlchemyProvider();
  const [nftRows, erc20Raw] = await Promise.all([
    alchemy.getNftsForPortfolio(owner),
    alchemy.getErc20Balances(owner),
  ]);

  const enrichedNfts = await alchemy.enrichPortfolioRowsIfSparse(nftRows);
  const nfts = enrichedNfts.map(mapAlchemyNftPortfolioRow);
  const erc20 = await enrichErc20Rows(erc20Raw);

  return {
    chainId: getCryptournsChainConfig().chainId,
    erc20,
    nfts,
  };
}
