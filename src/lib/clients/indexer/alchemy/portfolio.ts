import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { getCryptournsPublicClient } from "@/lib/clients/rpc/cryptournsPublicClient";
import { mapAlchemyNftPortfolioRow } from "@/lib/wallet/mapAlchemyNftPortfolioRow";
import type {
  Erc20PortfolioItemJson,
  NftPortfolioItemJson,
  OwnedCryptournsResponse,
  WalletPortfolioResponse,
} from "@/lib/wallet/portfolioTypes";
import { type Address, getAddress, parseAbi } from "viem";
import {
  mergePortfolioNftRows,
  type AlchemyNftPortfolioRow,
} from "./alchemyNftPortfolio";
import { fetchNftsPage, postJsonRpc } from "./client";
import { enrichPortfolioRowsIfSparse } from "./nftMetadata";
import { parseAlchemyOwnedNftPortfolio } from "./parseAlchemyNft";

async function fetchAllPortfolioPages(
  owner: string,
  options?: {
    includeSpam?: boolean;
    contractAddresses?: Address[];
    orderByTransferTime?: boolean;
  },
): Promise<AlchemyNftPortfolioRow[]> {
  const out: AlchemyNftPortfolioRow[] = [];
  let pageKey: string | undefined;
  do {
    const res = await fetchNftsPage(owner, pageKey, true, options);
    for (const raw of res.ownedNfts) {
      const parsed = parseAlchemyOwnedNftPortfolio(raw);
      if (parsed) out.push(parsed);
    }
    pageKey = res.pageKey;
  } while (pageKey);
  return out;
}

async function getCryptournsNftsForOwner(
  owner: string,
): Promise<AlchemyNftPortfolioRow[]> {
  return fetchAllPortfolioPages(owner, {
    includeSpam: true,
    contractAddresses: [CRYPTOURNS_CONTRACT.address],
  });
}

async function getNftsForPortfolio(
  owner: string,
): Promise<AlchemyNftPortfolioRow[]> {
  const baseOpts = { includeSpam: true as const };
  const [main, cryptournsOnly] = await Promise.all([
    fetchAllPortfolioPages(owner, baseOpts),
    getCryptournsNftsForOwner(owner),
  ]);
  return mergePortfolioNftRows(main, cryptournsOnly);
}

type AlchemyTokenBalancesResult = {
  address: string;
  tokenBalances: {
    contractAddress: string;
    tokenBalance: string | null;
    error?: string | null;
  }[];
};

async function getErc20Balances(
  owner: Address,
): Promise<{ contractAddress: Address; balanceRaw: bigint }[]> {
  const result = await postJsonRpc<AlchemyTokenBalancesResult>(
    "alchemy_getTokenBalances",
    [owner, "erc20"],
  );

  const out: { contractAddress: Address; balanceRaw: bigint }[] = [];
  for (const row of result.tokenBalances) {
    if (row.error || !row.tokenBalance) continue;
    const hex = row.tokenBalance;
    if (hex === "0x" || hex === "0x0") continue;
    let bal: bigint;
    try {
      bal = BigInt(hex);
    } catch {
      continue;
    }
    if (bal === BigInt(0)) continue;
    if (
      typeof row.contractAddress !== "string" ||
      !row.contractAddress.startsWith("0x")
    ) {
      continue;
    }
    out.push({
      contractAddress: getAddress(row.contractAddress),
      balanceRaw: bal,
    });
  }
  return out;
}

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

function sortByTokenId(items: NftPortfolioItemJson[]) {
  return [...items].sort((a, b) => {
    const na = BigInt(a.tokenId);
    const nb = BigInt(b.tokenId);
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  });
}

export async function getWalletPortfolioAlchemy(
  owner: Address,
): Promise<WalletPortfolioResponse> {
  const [nftRows, erc20Raw] = await Promise.all([
    getNftsForPortfolio(owner),
    getErc20Balances(owner),
  ]);

  const enrichedNfts = await enrichPortfolioRowsIfSparse(nftRows);
  const nfts = enrichedNfts.map(mapAlchemyNftPortfolioRow);
  const erc20 = await enrichErc20Rows(erc20Raw);

  return {
    chainId: getCryptournsChainConfig().chainId,
    erc20,
    nfts,
  };
}

export async function getOwnedCryptournsAlchemy(
  owner: Address,
): Promise<OwnedCryptournsResponse> {
  const rows = await getCryptournsNftsForOwner(owner);
  const enriched = await enrichPortfolioRowsIfSparse(rows);
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
