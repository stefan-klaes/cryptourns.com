import { ZERO_ADDRESS } from "@/lib/constants/zeroAddress";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { postJsonRpc } from "./client";
import { resolveTransferBlockTime } from "./resolveTransferBlockTime";

export async function getCryptournMintDetailsAlchemy(
  urnId: number,
): Promise<{ mintTx: string; mintedBy: string; mintedAt: Date } | null> {
  const contractLower = CRYPTOURNS_CONTRACT.address.toLowerCase();
  const id = BigInt(urnId);

  type AlchemyAssetTransfer = {
    hash: string;
    blockNum: string;
    from: string;
    to?: string | null;
    category: string;
    erc721TokenId?: string | null;
    tokenId?: string | null;
    rawContract?: { address?: string | null };
    metadata?: { blockTimestamp?: string };
  };

  type TransfersPage = {
    transfers: AlchemyAssetTransfer[];
    pageKey?: string;
  };

  let pageKey: string | undefined;

  const matchesMint = (t: AlchemyAssetTransfer): boolean => {
    if (t.category !== "erc721") return false;
    const rawAddr = t.rawContract?.address?.toLowerCase();
    if (rawAddr && rawAddr !== contractLower) return false;
    if ((t.from ?? "").toLowerCase() !== ZERO_ADDRESS.toLowerCase())
      return false;
    const tid = t.tokenId ?? t.erc721TokenId;
    if (tid == null || tid === "") return false;
    try {
      return BigInt(tid) === id;
    } catch {
      return false;
    }
  };

  let mint: AlchemyAssetTransfer | undefined;

  do {
    const params: Record<string, unknown> = {
      fromBlock: "0x0",
      toBlock: "latest",
      fromAddress: ZERO_ADDRESS,
      contractAddresses: [CRYPTOURNS_CONTRACT.address],
      category: ["erc721"],
      excludeZeroValue: false,
      order: "asc",
      withMetadata: true,
      maxCount: "0x3e8",
    };
    if (pageKey) params.pageKey = pageKey;

    const result = await postJsonRpc<TransfersPage>(
      "alchemy_getAssetTransfers",
      [params],
    );

    mint = result.transfers.find(matchesMint);
    if (mint) break;

    const next = result.pageKey?.trim();
    pageKey = next && next.length > 0 ? next : undefined;
  } while (pageKey);

  if (!mint) return null;

  const firstOwner = mint.to;
  if (
    typeof firstOwner !== "string" ||
    !firstOwner.startsWith("0x") ||
    firstOwner.length !== 42
  ) {
    return null;
  }

  const blockCache = new Map<string, Date>();
  const mintedAt = await resolveTransferBlockTime(
    mint.blockNum,
    mint.metadata,
    blockCache,
  );
  if (!mintedAt) return null;

  return {
    mintTx: mint.hash,
    mintedBy: firstOwner,
    mintedAt,
  };
}
