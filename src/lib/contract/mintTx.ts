import type { Address } from "viem";

export type MintWriteParams =
  | {
      functionName: "mint";
      args: readonly [Address];
      value: bigint;
    }
  | {
      functionName: "mintBulk";
      args: readonly [readonly Address[]];
      value: bigint;
    };

export function buildMintWriteParams(
  receivers: readonly Address[],
  mintPriceWei: bigint,
): MintWriteParams {
  if (receivers.length === 0) {
    throw new Error("At least one mint receiver is required");
  }

  const count = BigInt(receivers.length);
  const value = mintPriceWei * count;

  if (receivers.length === 1) {
    const receiver = receivers[0];
    if (!receiver) throw new Error("At least one mint receiver is required");
    return {
      functionName: "mint",
      args: [receiver],
      value,
    };
  }

  return {
    functionName: "mintBulk",
    args: [receivers],
    value,
  };
}
