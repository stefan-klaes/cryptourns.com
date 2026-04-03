import { postJsonRpc } from "./client";
import { coerceAlchemyBlockTimestampToDate } from "./parseAlchemyNft";

export async function resolveTransferBlockTime(
  blockNum: string,
  metadata: { blockTimestamp?: string } | undefined,
  blockCache: Map<string, Date>,
): Promise<Date | null> {
  const fromMeta = coerceAlchemyBlockTimestampToDate(metadata?.blockTimestamp);
  if (fromMeta) return fromMeta;
  const cached = blockCache.get(blockNum);
  if (cached) return cached;
  type EthBlock = { timestamp: string };
  const block = await postJsonRpc<EthBlock | null>(
    "eth_getBlockByNumber",
    [blockNum, false],
  );
  if (!block?.timestamp) return null;
  const d = new Date(Number.parseInt(block.timestamp, 16) * 1000);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return null;
  blockCache.set(blockNum, d);
  return d;
}
