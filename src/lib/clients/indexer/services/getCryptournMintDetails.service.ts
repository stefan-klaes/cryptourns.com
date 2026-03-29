import type { Hash } from "viem";
import { getAddress } from "viem";
import { AlchemyProvider } from "../AlchemyProvider";

type MintDetailsProvider = {
  readonly name: string;
  getCryptournMintDetails(
    urnId: number,
  ): Promise<{ mintTx: string; mintedBy: string; mintedAt: Date } | null>;
};

export type CryptournMintDetails = {
  mintTx: Hash;
  mintedBy: string;
  mintedAt: Date;
};

/** Mint tx, first owner (`Transfer` `to`), and time via Alchemy Transfers API (+ block fallback for timestamp). */
export async function getCryptournMintDetails(
  urnId: number,
): Promise<CryptournMintDetails | null> {
  const providers: MintDetailsProvider[] = [new AlchemyProvider()];
  let lastError: unknown;
  for (const p of providers) {
    console.log(`[indexer] getCryptournMintDetails → ${p.name}`);
    try {
      const raw = await p.getCryptournMintDetails(urnId);
      if (!raw) return null;
      return {
        mintTx: raw.mintTx as Hash,
        mintedBy: getAddress(raw.mintedBy as `0x${string}`),
        mintedAt: raw.mintedAt,
      };
    } catch (err) {
      lastError = err;
      console.error(
        `[indexer] getCryptournMintDetails failed (${p.name}):`,
        err,
      );
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
