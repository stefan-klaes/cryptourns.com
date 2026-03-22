import type { Address } from "viem";
import { ViemProvider } from "../ViemProvider";

type IndexerTbaProvider = {
  readonly name: string;
  getTokenboundAccount(urnId: number): Promise<Address>;
};

export async function getTokenboundAccount(urnId: number): Promise<Address> {
  const providers: IndexerTbaProvider[] = [new ViemProvider()];
  let lastError: unknown;
  for (const p of providers) {
    console.log(`[indexer] getTokenboundAccount → ${p.name}`);
    try {
      return await p.getTokenboundAccount(urnId);
    } catch (err) {
      lastError = err;
      console.error(`[indexer] getTokenboundAccount failed (${p.name}):`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
