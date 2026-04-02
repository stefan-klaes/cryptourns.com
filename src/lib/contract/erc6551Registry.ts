import { portfolioNftKey } from "@/lib/wallet/portfolioNftKey";
import type { NftPortfolioItemJson } from "@/lib/wallet/portfolioTypes";
import type { Address, PublicClient } from "viem";
import { getAddress, parseAbi } from "viem";

/** Canonical ERC-6551 registry (same address on supported EVM chains). */
export const ERC6551_REGISTRY =
  "0x000000006551c19487814612e58FE06813775758" as const;

/** Cryptourns contract uses this proxy as `implementation` in registry calls. */
export const ERC6551_ACCOUNT_PROXY =
  "0x55266d75D1a14E4572138116aF39863Ed6596E7F" as const;

const SALT_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

const registryAccountAbi = parseAbi([
  "function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) view returns (address)",
]);

/**
 * Returns portfolio row keys whose ERC-6551 account address equals `tbaAddress`
 * (i.e. sending that NFT to this vault would be sending the urn into itself).
 */
export async function fetchNftKeysWhoseTbaEquals(
  client: PublicClient,
  nfts: NftPortfolioItemJson[],
  tbaAddress: Address,
  chainId: number,
): Promise<Set<string>> {
  const target = getAddress(tbaAddress).toLowerCase();
  const out = new Set<string>();
  if (nfts.length === 0) return out;

  const contracts: {
    address: typeof ERC6551_REGISTRY;
    abi: typeof registryAccountAbi;
    functionName: "account";
    args: readonly [Address, typeof SALT_ZERO, bigint, Address, bigint];
  }[] = [];
  const nftsForContract: NftPortfolioItemJson[] = [];

  for (const nft of nfts) {
    let tid: bigint;
    try {
      tid = BigInt(nft.tokenId);
    } catch {
      continue;
    }
    nftsForContract.push(nft);
    contracts.push({
      address: ERC6551_REGISTRY,
      abi: registryAccountAbi,
      functionName: "account",
      args: [
        ERC6551_ACCOUNT_PROXY,
        SALT_ZERO,
        BigInt(chainId),
        getAddress(nft.contractAddress),
        tid,
      ],
    });
  }

  if (contracts.length === 0) return out;

  const results = await client.multicall({ contracts, allowFailure: true });

  for (let i = 0; i < nftsForContract.length; i++) {
    const nft = nftsForContract[i];
    const r = results[i];
    if (!nft || !r || r.status !== "success") continue;
    const account = getAddress(r.result as Address).toLowerCase();
    if (account === target) out.add(portfolioNftKey(nft));
  }

  return out;
}
