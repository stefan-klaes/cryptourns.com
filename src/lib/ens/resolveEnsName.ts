import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress } from "viem/actions";
import { normalize } from "viem/ens";

const MAX_ENS_INPUT_LEN = 512;

export type ResolveEnsNameResult =
  | { ok: true; address: Address; normalizedName: string }
  | { ok: false; error: string };

function mainnetRpcUrl(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) {
    throw new Error("Missing ALCHEMY_API_KEY for ENS resolution");
  }
  return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
}

let mainnetClient: ReturnType<typeof createPublicClient> | undefined;

function getMainnetClient() {
  if (!mainnetClient) {
    mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(mainnetRpcUrl()),
    });
  }
  return mainnetClient;
}

/**
 * Validates ENS name shape (via viem normalize) and resolves it to an address
 * on Ethereum mainnet — required for `.eth` and the global ENS registry.
 */
export async function resolveEnsName(
  raw: string,
): Promise<ResolveEnsNameResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Empty name" };
  }
  if (trimmed.length > MAX_ENS_INPUT_LEN) {
    return { ok: false, error: "Name too long" };
  }

  let normalizedName: string;
  try {
    normalizedName = normalize(trimmed);
  } catch {
    return { ok: false, error: "Invalid ENS name" };
  }

  const address = await getEnsAddress(getMainnetClient(), {
    name: normalizedName,
  });

  if (!address) {
    return {
      ok: false,
      error: "ENS name not found or has no Ethereum address",
    };
  }

  return { ok: true, address, normalizedName };
}
