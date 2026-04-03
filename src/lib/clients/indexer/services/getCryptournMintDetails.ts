import type { Hash } from "viem";
import { getAddress } from "viem";
import { getCryptournMintDetailsAlchemy } from "../alchemy/mintDetails";

export type CryptournMintDetails = {
  mintTx: Hash;
  mintedBy: string;
  mintedAt: Date;
};

export async function getCryptournMintDetails(
  urnId: number,
): Promise<CryptournMintDetails | null> {
  const raw = await getCryptournMintDetailsAlchemy(urnId);
  if (!raw) return null;
  return {
    mintTx: raw.mintTx as Hash,
    mintedBy: getAddress(raw.mintedBy as `0x${string}`),
    mintedAt: raw.mintedAt,
  };
}
