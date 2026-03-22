"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { buildMintWriteParams } from "@/lib/contract/mintTx";
import { getMintedTokenIdsFromReceipt } from "@/lib/contract/parseMintReceipt";
import { useCryptourns } from "@/providers/CryptournsProvider";

export type MintStep = "idle" | "verify" | "waiting" | "done" | "error";

export function useMint() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { mintPriceWei, refetch } = useCryptourns();

  const [step, setStep] = useState<MintStep>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mintedTokenIds, setMintedTokenIds] = useState<bigint[]>([]);

  const { writeContractAsync, reset: resetWrite } = useWriteContract();

  const {
    data: receipt,
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isReceiptSuccess || !receipt) return;
    setMintedTokenIds(getMintedTokenIdsFromReceipt(receipt));
    void refetch();
    setStep("done");
  }, [isReceiptSuccess, receipt, refetch]);

  useEffect(() => {
    if (!isReceiptError || !txHash) return;
    setStep("error");
    setErrorMessage("Transaction failed on-chain.");
  }, [isReceiptError, txHash]);

  const reset = useCallback(() => {
    setStep("idle");
    setTxHash(undefined);
    setErrorMessage(null);
    setMintedTokenIds([]);
    resetWrite();
  }, [resetWrite]);

  const mint = useCallback(
    async (receivers: Address[]) => {
      if (!isConnected) return;

      setErrorMessage(null);
      setMintedTokenIds([]);
      setTxHash(undefined);
      resetWrite();

      try {
        const params = buildMintWriteParams(receivers, mintPriceWei);
        setStep("verify");

        if (chainId !== CRYPTOURNS_CONTRACT.chainId) {
          if (!switchChainAsync) {
            throw new Error("Switch to Sepolia in your wallet to mint.");
          }
          await switchChainAsync({ chainId: CRYPTOURNS_CONTRACT.chainId });
        }

        const hash = await writeContractAsync({
          address: CRYPTOURNS_CONTRACT.address,
          abi: CRYPTOURNS_CONTRACT.abi,
          chainId: CRYPTOURNS_CONTRACT.chainId,
          functionName: params.functionName,
          args: params.args as never,
          value: params.value,
        });

        setTxHash(hash);
        setStep("waiting");
      } catch (e) {
        setStep("error");
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setErrorMessage(
          /user rejected|denied|rejected the request/i.test(msg)
            ? "Signature rejected in wallet."
            : msg,
        );
      }
    },
    [
      chainId,
      isConnected,
      mintPriceWei,
      resetWrite,
      switchChainAsync,
      writeContractAsync,
    ],
  );

  return {
    step,
    isOpen: step !== "idle",
    mint,
    reset,
    errorMessage,
    mintedTokenIds,
  };
}
