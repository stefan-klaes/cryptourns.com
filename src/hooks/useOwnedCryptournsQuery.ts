"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { loadOwnedCryptournsClient } from "@/lib/wallet/loadOwnedCryptournsClient";

type Options = {
  enabled?: boolean;
};

export function useOwnedCryptournsQuery(options?: Options) {
  const { address, isConnected } = useAccount();
  const extraEnabled = options?.enabled !== false;
  const enabled = Boolean(address && isConnected && extraEnabled);

  return useQuery({
    queryKey: ["owned-cryptourns", address],
    queryFn: () => loadOwnedCryptournsClient(address!),
    enabled,
    staleTime: 60_000,
  });
}
