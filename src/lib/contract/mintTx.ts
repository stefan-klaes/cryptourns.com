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
    }
  | {
      functionName: "mintReferral";
      args: readonly [Address, Address];
      value: bigint;
    }
  | {
      functionName: "mintAdvanced";
      args: readonly [readonly Address[], Address];
      value: bigint;
    };

export function buildMintWriteParams(
  receivers: readonly Address[],
  mintPriceWei: bigint,
  referralAddress?: Address,
): MintWriteParams {
  if (receivers.length === 0) {
    throw new Error("At least one mint receiver is required");
  }

  const count = BigInt(receivers.length);
  const value = mintPriceWei * count;
  const useReferral = referralAddress !== undefined;

  if (receivers.length === 1) {
    const receiver = receivers[0];
    if (!receiver) throw new Error("At least one mint receiver is required");
    if (useReferral) {
      return {
        functionName: "mintReferral",
        args: [receiver, referralAddress!],
        value,
      };
    }
    return {
      functionName: "mint",
      args: [receiver],
      value,
    };
  }

  if (useReferral) {
    return {
      functionName: "mintAdvanced",
      args: [receivers, referralAddress!],
      value,
    };
  }

  return {
    functionName: "mintBulk",
    args: [receivers],
    value,
  };
}
