"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Address } from "viem";
import { formatEther } from "viem";
import { useReadContracts } from "wagmi";

import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { formatEthereum } from "@/lib/utils/formatEthereum";

const contractAddress = CRYPTOURNS_CONTRACT.contractAddress as Address;

interface CryptournsContextType {
  totalSupply: number;
  /** Mint price in ETH (number); prefer `mintPriceWei` for exact totals. */
  mintPrice: number;
  mintPriceWei: bigint;
  formattedMintPrice: string;
  loading: boolean;
  refetch: () => void;
}

const CryptournsContext = createContext<CryptournsContextType | undefined>(
  undefined,
);

export function useCryptourns() {
  const context = useContext(CryptournsContext);
  if (!context) {
    throw new Error("useCryptourns must be used within a CryptournsProvider");
  }
  return context;
}

interface CryptournsProviderProps {
  children: ReactNode;
}

export function CryptournsProvider({ children }: CryptournsProviderProps) {
  const { data, isLoading, isFetching, refetch } = useReadContracts({
    contracts: [
      {
        ...CRYPTOURNS_CONTRACT,
        functionName: "totalSupply",
      },
      {
        ...CRYPTOURNS_CONTRACT,
        functionName: "mintPrice",
      },
    ],
  });

  const [totalSupplyRaw, mintPriceRaw] = data ?? [];

  const totalSupply = Number(totalSupplyRaw?.result ?? 0);
  const mintPriceWei = (mintPriceRaw?.result ?? BigInt(0)) as bigint;
  const mintPrice = Number(formatEther(mintPriceWei));
  const formattedMintPrice = formatEthereum(mintPriceWei, 4);

  const value: CryptournsContextType = {
    totalSupply,
    mintPrice,
    mintPriceWei,
    formattedMintPrice,
    loading: isLoading || isFetching,
    refetch,
  };

  return (
    <CryptournsContext.Provider value={value}>
      {children}
    </CryptournsContext.Provider>
  );
}
