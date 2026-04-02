import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getEnsName } from "viem/actions";

/**
 * Returns the wallet's primary ENS name on Ethereum mainnet, if set.
 * Best-effort: missing API key or RPC errors yield `null`.
 */
export async function getEnsPrimaryName(
  address: Address,
): Promise<string | null> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return null;
  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${key}`),
    });
    return await getEnsName(client, { address });
  } catch {
    return null;
  }
}
