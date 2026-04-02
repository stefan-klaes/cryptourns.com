"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";

/** `LogReferral` action value when a referrer claims (see contract.sol). */
const CLAIM_ACTION = 1;

const logReferralEvent = parseAbiItem(
  "event LogReferral(address indexed referralAddress, uint32 mints, uint256 amount, uint256 timestamp, uint8 action)",
);

function deploymentFromBlock(): bigint {
  const raw = process.env.NEXT_PUBLIC_CRYPTOURNS_DEPLOYMENT_BLOCK;
  if (raw && /^\d+$/.test(raw)) return BigInt(raw);
  return BigInt(0);
}

/**
 * Lifetime ETH claimed by `address` via referral claims, by summing
 * `LogReferral` events (action = claim). Not stored per wallet on-chain.
 * May fail if the RPC rejects large `getLogs` ranges — then `isError` is true.
 */
export function useReferralClaimedTotal(address: Address | undefined) {
  const publicClient = usePublicClient({
    chainId: CRYPTOURNS_CONTRACT.chainId,
  });

  return useQuery({
    queryKey: [
      "referralClaimedTotal",
      CRYPTOURNS_CONTRACT.chainId,
      CRYPTOURNS_CONTRACT.address,
      address,
    ],
    enabled: Boolean(address && publicClient),
    staleTime: 60_000,
    queryFn: async () => {
      if (!publicClient || !address) return BigInt(0);

      const logs = await publicClient.getLogs({
        address: CRYPTOURNS_CONTRACT.address,
        event: logReferralEvent,
        args: { referralAddress: address },
        fromBlock: deploymentFromBlock(),
        toBlock: "latest",
      });

      let total = BigInt(0);
      for (const log of logs) {
        const action = log.args?.action;
        const amount = log.args?.amount;
        const actionNum =
          typeof action === "number"
            ? action
            : typeof action === "bigint"
              ? Number(action)
              : NaN;
        if (actionNum === CLAIM_ACTION && typeof amount === "bigint") {
          total += amount;
        }
      }
      return total;
    },
  });
}
