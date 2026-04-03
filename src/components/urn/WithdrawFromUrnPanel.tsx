"use client";

import { TokenboundClient } from "@tokenbound/sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  encodeFunctionData,
  getAddress,
  isAddress,
  parseAbi,
  parseUnits,
  type Address,
} from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import { UrnRenderer } from "@/components/mint/UrnRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UrnCrackOverlay } from "@/components/urn/UrnCrackOverlay";
import {
  WithdrawProgressDialog,
  type WithdrawProgressStep,
} from "@/components/urn/WithdrawProgressDialog";
import { AssetType } from "@/generated/prisma";
import { wagmiConfig } from "@/lib/clients/wagmi";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { ERC6551_ACCOUNT_PROXY } from "@/lib/contract/erc6551Registry";
import { erc20TransferAbi } from "@/lib/contract/standardTokenAbis";
import type { UrnIndexedAssetRow } from "@/lib/urn/getUrnIndexedAssets";
import { isVaultCryptournSelfAsset } from "@/lib/urn/isVaultCryptournSelfAsset";
import { computeWithdrawRomanPreview } from "@/lib/urn/urnWithdrawRomanPreview";
import { isWalletUserRejection } from "@/lib/urn/walletUserRejection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const erc20MetaAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

type WithdrawFromUrnPanelProps = {
  embedded?: boolean;
  open: boolean;
  urnId: number;
  tbaAddress: Address;
  chainName: string;
  cracked: boolean;
  candleCount: number;
  indexedCoins: UrnIndexedAssetRow[];
  indexedNfts: UrnIndexedAssetRow[];
  isConnected: boolean;
  entryRow?: UrnIndexedAssetRow | null;
  backClosesSheet?: boolean;
  onRequestClose?: () => void;
};

function shortContract(addr: string): string {
  if (!addr.startsWith("0x") || addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function resolveRecipient(raw: string): Promise<Address> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Enter a recipient address or ENS name.");
  }
  if (isAddress(trimmed)) {
    return getAddress(trimmed);
  }
  const res = await fetch("/api/ens/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed }),
  });
  const json = (await res.json()) as { address?: string; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Could not resolve ENS name.");
  }
  if (!json.address || !isAddress(json.address)) {
    throw new Error("Invalid response from ENS resolver.");
  }
  return getAddress(json.address);
}

export function WithdrawFromUrnPanel({
  embedded = false,
  open,
  urnId,
  tbaAddress,
  chainName,
  cracked,
  candleCount,
  indexedCoins,
  indexedNfts,
  isConnected,
  entryRow = null,
  backClosesSheet = false,
  onRequestClose,
}: WithdrawFromUrnPanelProps) {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: CRYPTOURNS_CONTRACT.chainId });

  const [activeTab, setActiveTab] = useState<"nfts" | "coins">(() =>
    indexedNfts.length > 0 || indexedCoins.length === 0 ? "nfts" : "coins",
  );
  const [confirmRow, setConfirmRow] = useState<UrnIndexedAssetRow | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [qtyStr, setQtyStr] = useState("1");
  const [busy, setBusy] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressStep, setProgressStep] = useState<WithdrawProgressStep>("verify");
  const [progressError, setProgressError] = useState<string | null>(null);

  const totalNftUnits = useMemo(
    () => indexedNfts.reduce((s, r) => s + r.quantity, 0),
    [indexedNfts],
  );

  const tbClient = useMemo(() => {
    if (!walletClient || !publicClient) return null;
    return new TokenboundClient({
      walletClient,
      publicClient,
      chainId: CRYPTOURNS_CONTRACT.chainId,
      implementationAddress: ERC6551_ACCOUNT_PROXY,
    });
  }, [walletClient, publicClient]);

  useEffect(() => {
    if (!open) return;
    if (address) {
      setRecipientInput(address);
    }
  }, [open, address]);

  useEffect(() => {
    if (!open) {
      setConfirmRow(null);
      return;
    }
    if (entryRow) {
      setConfirmRow(entryRow);
    }
  }, [open, entryRow]);

  useEffect(() => {
    if (!confirmRow) return;
    if (confirmRow.type === AssetType.ERC721) {
      setQtyStr("1");
    } else if (confirmRow.type === AssetType.ERC1155) {
      setQtyStr("1");
    } else {
      setAmountStr("");
    }
  }, [confirmRow]);

  const ensureChain = useCallback(async () => {
    if (chainId === CRYPTOURNS_CONTRACT.chainId) return;
    if (!switchChainAsync) {
      throw new Error("Switch to " + chainName + " in your wallet to continue.");
    }
    await switchChainAsync({ chainId: CRYPTOURNS_CONTRACT.chainId });
  }, [chainId, chainName, switchChainAsync]);

  const qtySending = useMemo(() => {
    if (!confirmRow) return 0;
    if (confirmRow.type === AssetType.ERC721) return 1;
    if (confirmRow.type === AssetType.ERC1155) {
      const n = Number.parseInt(qtyStr, 10);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }, [confirmRow, qtyStr]);

  const romanPreview = useMemo(() => {
    if (!confirmRow) {
      return computeWithdrawRomanPreview(totalNftUnits, AssetType.ERC721, 0);
    }
    return computeWithdrawRomanPreview(
      totalNftUnits,
      confirmRow.type,
      confirmRow.type === AssetType.ERC20 ? 0 : qtySending,
    );
  }, [confirmRow, totalNftUnits, qtySending]);

  const previewAfterCount = romanPreview.afterNftUnits;

  const resetProgress = useCallback(() => {
    setProgressOpen(false);
    setProgressStep("verify");
    setProgressError(null);
  }, []);

  const handleWithdraw = useCallback(async () => {
    if (!confirmRow || !publicClient || !tbClient) return;
    if (isVaultCryptournSelfAsset(urnId, confirmRow)) {
      toast.error("You cannot withdraw this urn NFT from its own vault.");
      return;
    }

    setProgressError(null);
    setProgressOpen(true);
    setProgressStep("verify");
    setBusy(true);

    try {
      await ensureChain();
      const recipient = await resolveRecipient(recipientInput);
      const token = getAddress(confirmRow.contractAddress);

      let hash: `0x${string}`;

      if (confirmRow.type === AssetType.ERC721) {
        hash = await tbClient.transferNFT({
          account: tbaAddress,
          tokenContract: token,
          tokenId: confirmRow.tokenId,
          recipientAddress: recipient,
          tokenType: "ERC721",
          chainId: CRYPTOURNS_CONTRACT.chainId,
        });
      } else if (confirmRow.type === AssetType.ERC1155) {
        const max = confirmRow.quantity;
        if (qtySending < 1 || qtySending > max) {
          throw new Error("Enter a quantity between 1 and " + String(max) + ".");
        }
        hash = await tbClient.transferNFT({
          account: tbaAddress,
          tokenContract: token,
          tokenId: confirmRow.tokenId,
          recipientAddress: recipient,
          tokenType: "ERC1155",
          amount: qtySending,
          chainId: CRYPTOURNS_CONTRACT.chainId,
        });
      } else {
        const decimals = await publicClient.readContract({
          address: token,
          abi: erc20MetaAbi,
          functionName: "decimals",
        });
        const balance = await publicClient.readContract({
          address: token,
          abi: erc20MetaAbi,
          functionName: "balanceOf",
          args: [tbaAddress],
        });
        const trimmed = amountStr.trim();
        if (!trimmed) {
          throw new Error("Enter an amount to send.");
        }
        let amountWei: bigint;
        try {
          amountWei = parseUnits(trimmed, decimals);
        } catch {
          throw new Error("Invalid amount for this token.");
        }
        if (amountWei <= BigInt(0)) {
          throw new Error("Amount must be greater than zero.");
        }
        if (amountWei > balance) {
          throw new Error("Amount exceeds the vault balance on-chain.");
        }
        const data = encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [recipient, amountWei],
        });
        hash = await tbClient.execute({
          account: tbaAddress,
          to: token,
          value: BigInt(0),
          data,
          chainId: CRYPTOURNS_CONTRACT.chainId,
        });
      }

      setProgressStep("waiting");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      void router.refresh();
      setProgressStep("done");
      toast.success("Transfer confirmed.");
      setConfirmRow(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      const friendly = /user rejected|denied|rejected the request/i.test(msg)
        ? "Signature rejected in wallet."
        : /revert|failed/i.test(msg)
          ? "Transaction failed on-chain."
          : msg;
      if (isWalletUserRejection(e)) {
        resetProgress();
        toast.error(friendly);
      } else {
        setProgressStep("error");
        setProgressError(friendly);
        toast.error(friendly);
      }
    } finally {
      setBusy(false);
    }
  }, [
    amountStr,
    confirmRow,
    ensureChain,
    publicClient,
    qtySending,
    recipientInput,
    resetProgress,
    router,
    tbaAddress,
    tbClient,
    urnId,
  ]);

  const outerClass = embedded
    ? "space-y-4"
    : "space-y-4 rounded-xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-sm";

  if (!isConnected) {
    return (
      <div className={outerClass}>
        <p className="text-sm text-muted-foreground">
          Connect the wallet that owns this urn to withdraw assets from the vault.
        </p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => openConnectModal?.()}
        >
          Connect wallet
        </Button>
      </div>
    );
  }

  if (!tbClient) {
    return (
      <div className={cn(outerClass, "flex items-center gap-2 py-6 text-sm text-muted-foreground")}>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Preparing wallet client…
      </div>
    );
  }

  return (
    <div className={outerClass}>
      {confirmRow ? (
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 px-2"
            disabled={busy}
            onClick={() => {
              if (backClosesSheet && onRequestClose) {
                onRequestClose();
                return;
              }
              setConfirmRow(null);
            }}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>

          <div className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                {confirmRow.type !== AssetType.ERC20 && confirmRow.imageUrl ? (
                  <Image
                    src={confirmRow.imageUrl}
                    alt={
                      confirmRow.name?.trim() ||
                      "Token #" + confirmRow.tokenId
                    }
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : confirmRow.type === AssetType.ERC20 ? (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Coins className="size-7" aria-hidden />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[0.65rem] font-medium text-muted-foreground">
                    NFT
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                  You send
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {confirmRow.type === AssetType.ERC20
                    ? confirmRow.name?.trim() ||
                      "ERC-20 · " + shortContract(confirmRow.contractAddress)
                    : confirmRow.name?.trim() ||
                      "Token #" + confirmRow.tokenId}
                </p>
                {confirmRow.type !== AssetType.ERC20 &&
                confirmRow.collectionName?.trim() ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {confirmRow.collectionName.trim()}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] uppercase text-muted-foreground">
                    {confirmRow.type}
                  </span>
                  {confirmRow.type === AssetType.ERC721 ? (
                    <span className="ml-2 tabular-nums">
                      Quantity: <span className="font-medium text-foreground">1</span>
                    </span>
                  ) : null}
                  {confirmRow.type === AssetType.ERC1155 ? (
                    <span className="ml-2 tabular-nums">
                      Sending:{" "}
                      <span className="font-medium text-foreground">
                        {qtyStr.trim() || "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        (max {confirmRow.quantity.toLocaleString()})
                      </span>
                    </span>
                  ) : null}
                  {confirmRow.type === AssetType.ERC20 ? (
                    <span className="ml-2 tabular-nums">
                      Amount:{" "}
                      <span className="font-medium text-foreground">
                        {amountStr.trim() ? amountStr.trim() : "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        · indexed balance{" "}
                        {confirmRow.quantity.toLocaleString()} units
                      </span>
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-[0.65rem] text-muted-foreground">
                  {shortContract(confirmRow.contractAddress)}
                  {confirmRow.type !== AssetType.ERC20 ? (
                    <> · #{confirmRow.tokenId}</>
                  ) : null}
                </p>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <p className="mb-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                Now
              </p>
              <div className="relative">
                <UrnRenderer
                  assetCount={totalNftUnits}
                  candleCount={candleCount}
                  seed={"cryptourn-" + String(urnId)}
                  className="w-full max-w-[9rem] mx-auto"
                />
              </div>
            </div>
            <div className="relative">
              <p className="mb-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                After send
              </p>
              <div className="relative">
                <UrnRenderer
                  assetCount={previewAfterCount}
                  candleCount={candleCount}
                  seed={"cryptourn-" + String(urnId)}
                  className="w-full max-w-[9rem] mx-auto"
                />
                {!cracked ? <UrnCrackOverlay /> : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            {!cracked ? (
              <p>
                <span className="font-medium text-destructive">First outbound send</span>{" "}
                cracks this urn in the index (permanent). Preview shows the crack overlay.
              </p>
            ) : (
              <p>This urn is already cracked; the overlay matches the current on-chain state.</p>
            )}
            {romanPreview.romanChanges ? (
              <p className="mt-2">
                Roman numeral (NFT units):{" "}
                <span className="font-mono text-foreground">{romanPreview.beforeLabel}</span>
                {" → "}
                <span className="font-mono text-foreground">{romanPreview.afterLabel}</span>
              </p>
            ) : (
              <p className="mt-2">
                Roman numeral unchanged (this row is coins-only for the mosaic).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="withdraw-recipient" className="text-sm font-medium text-foreground">
              Recipient
            </label>
            <Input
              id="withdraw-recipient"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="0x… or name.eth"
              disabled={busy}
              autoComplete="off"
            />
            <p className="text-[0.7rem] text-muted-foreground">
              ENS names resolve on Ethereum mainnet (same as the rest of the app).
            </p>
          </div>

          {confirmRow.type === AssetType.ERC1155 ? (
            <div className="space-y-2">
              <label htmlFor="withdraw-qty" className="text-sm font-medium text-foreground">
                Quantity (max {confirmRow.quantity})
              </label>
              <Input
                id="withdraw-qty"
                inputMode="numeric"
                value={qtyStr}
                onChange={(e) => setQtyStr(e.target.value)}
                disabled={busy}
              />
            </div>
          ) : null}

          {confirmRow.type === AssetType.ERC20 ? (
            <div className="space-y-2">
              <label htmlFor="withdraw-amt" className="text-sm font-medium text-foreground">
                Amount (token units)
              </label>
              <Input
                id="withdraw-amt"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.0"
                disabled={busy}
              />
              <p className="text-[0.7rem] text-muted-foreground">
                Indexed balance: {confirmRow.quantity.toLocaleString()} (on-chain balance is checked before send).
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={busy}
            onClick={() => void handleWithdraw()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              "Sign withdrawal"
            )}
          </Button>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v === "coins" ? "coins" : "nfts");
          }}
          className="flex flex-col gap-3"
        >
          <TabsList variant="line" className="grid h-9 w-full grid-cols-2">
            <TabsTrigger value="nfts">NFTs ({indexedNfts.length})</TabsTrigger>
            <TabsTrigger value="coins">Coins ({indexedCoins.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="nfts" className="flex flex-col gap-2">
            {indexedNfts.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No indexed NFTs in this vault.</p>
            ) : (
              <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-1">
                {indexedNfts.map((row) => {
                  const blocked = isVaultCryptournSelfAsset(urnId, row);
                  const title = row.name?.trim() || "Token #" + row.tokenId;
                  return (
                    <li key={row.contractAddress + "-" + row.tokenId + "-" + row.type}>
                      <button
                        type="button"
                        disabled={blocked}
                        onClick={() => setConfirmRow(row)}
                        className={cn(
                          "flex w-full gap-3 rounded-xl border border-border bg-card/80 p-3 text-left transition-colors",
                          "hover:border-primary/40 hover:bg-card",
                          blocked && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                          {row.imageUrl ? (
                            <Image
                              src={row.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                              unoptimized
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[0.65rem] text-muted-foreground">
                              NFT
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.type}
                            {row.quantity > 1 ? " · ×" + row.quantity : ""}
                          </p>
                          {blocked ? (
                            <p className="mt-1 text-xs text-destructive">Cannot withdraw the urn into itself</p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="coins" className="flex flex-col gap-2">
            {indexedCoins.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No indexed coins in this vault.</p>
            ) : (
              <ul className="max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-1">
                {indexedCoins.map((row) => (
                  <li key={row.contractAddress + "-" + row.tokenId}>
                    <button
                      type="button"
                      onClick={() => setConfirmRow(row)}
                      className="flex w-full flex-col gap-1 rounded-xl border border-border bg-card/80 p-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
                    >
                      <span className="font-mono text-xs text-primary">
                        {row.contractAddress.slice(0, 6) + "…" + row.contractAddress.slice(-4)}
                      </span>
                      <span className="text-sm text-foreground">
                        {row.quantity.toLocaleString()} units
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}

      <WithdrawProgressDialog
        open={progressOpen}
        onOpenChange={(v) => {
          if (!v) {
            if (progressStep === "done" || progressStep === "error") {
              resetProgress();
            }
            return;
          }
          setProgressOpen(true);
        }}
        step={progressStep}
        errorMessage={progressError}
        onComplete={() => {
          resetProgress();
          queueMicrotask(() => onRequestClose?.());
        }}
      />
    </div>
  );
}
