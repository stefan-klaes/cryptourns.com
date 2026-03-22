import type { Asset } from "../Asset";
import { AlchemyProvider } from "../AlchemyProvider";

type IndexerNftProvider = {
  readonly name: string;
  getNfts(owner: string, pageKey?: string): Promise<Asset[]>;
};

export async function getNfts(
  owner: string,
  pageKey?: string,
): Promise<Asset[]> {
  const providers: IndexerNftProvider[] = [new AlchemyProvider()];
  let lastError: unknown;
  for (const p of providers) {
    console.log(`[indexer] getNfts → ${p.name}`);
    try {
      return await p.getNfts(owner, pageKey);
    } catch (err) {
      lastError = err;
      console.error(`[indexer] getNfts failed (${p.name}):`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
