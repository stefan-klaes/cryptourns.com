import { AlchemyProvider } from "../AlchemyProvider";
import { getTokenboundAccount } from "./getTokenboundAccount.service";

type IndexerOutboundAssetProvider = {
  readonly name: string;
  hasOutboundAssetTransfers(fromAddress: string): Promise<boolean>;
};

/**
 * True if the urn's TBA has ever sent ERC-20, ERC-721, or ERC-1155 (Alchemy Transfers API).
 */
export async function isUrnCracked(urnId: number): Promise<boolean> {
  const tba = await getTokenboundAccount(urnId);
  const providers: IndexerOutboundAssetProvider[] = [new AlchemyProvider()];
  let lastError: unknown;
  for (const p of providers) {
    console.log(`[indexer] isUrnCracked → ${p.name}`);
    try {
      return await p.hasOutboundAssetTransfers(tba);
    } catch (err) {
      lastError = err;
      console.error(`[indexer] isUrnCracked failed (${p.name}):`, err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
