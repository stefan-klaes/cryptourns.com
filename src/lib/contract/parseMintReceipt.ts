import { parseEventLogs, type TransactionReceipt } from "viem";

import { ZERO_ADDRESS } from "@/lib/constants/zeroAddress";

import { abi } from "./abi";

/**
 * ERC-721 mints emit `Transfer` from the zero address.
 */
export function getMintedTokenIdsFromReceipt(
  receipt: TransactionReceipt,
): bigint[] {
  const logs = parseEventLogs({
    abi,
    logs: receipt.logs,
    eventName: "Transfer",
  });

  const ids: bigint[] = [];
  for (const log of logs) {
    if (log.args.from?.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) continue;
    if (log.args.tokenId === undefined) continue;
    ids.push(log.args.tokenId);
  }
  return ids;
}
