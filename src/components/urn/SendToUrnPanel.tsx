"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatUnits,
  getAddress,
  parseUnits,
  type Address,
} from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { getPublicClient, waitForTransactionReceipt } from "wagmi/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { wagmiConfig } from "@/lib/clients/wagmi";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { fetchNftKeysWhoseTbaEquals } from "@/lib/contract/erc6551Registry";
import {
  erc1155SafeTransferAbi,
  erc20TransferAbi,
  erc721SafeTransferAbi,
} from "@/lib/contract/standardTokenAbis";
import { displayableNftImageUrl } from "@/lib/wallet/displayableNftImageUrl";
import { loadWalletPortfolioClient } from "@/lib/wallet/loadWalletPortfolioClient";
import {
  portfolioNftKey,
  portfolioNftKeyFromParts,
} from "@/lib/wallet/portfolioNftKey";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  Erc20PortfolioItemJson,
  NftPortfolioItemJson,
} from "@/lib/wallet/portfolioTypes";

type SendToUrnPanelProps = {
  tbaAddress: Address;
  chainName: string;
  explorerBaseUrl: string;
  /** When set, that Cryptourns NFT cannot be sent into this urn’s vault (same token). */
  excludeSendSelfNft?: { contractAddress: Address; tokenId: string };
  /** Omit outer card when used inside a sheet. */
  embedded?: boolean;
};

type ConfirmState =
  | { kind: "erc20"; row: Erc20PortfolioItemJson }
  | { kind: "nft721"; nft: NftPortfolioItemJson }
  | { kind: "nft1155"; nft: NftPortfolioItemJson };

function confirmStateKey(s: ConfirmState): string {
  if (s.kind === "erc20") return `e20-${s.row.contractAddress}`;
  return `nft-${s.nft.contractAddress}-${s.nft.tokenId}-${s.kind}`;
}

function nftCollectionLine(nft: NftPortfolioItemJson): string {
  const n = nft.collectionName?.trim();
  if (n) return n;
  return `${nft.contractAddress.slice(0, 6)}…${nft.contractAddress.slice(-4)}`;
}

function nftConfirmSubtitle(nft: NftPortfolioItemJson): string {
  const col = nftCollectionLine(nft);
  let id: string;
  try {
    id = BigInt(nft.tokenId).toString();
  } catch {
    id = nft.tokenId;
  }
  return `${col} · #${id}`;
}

function ConfirmAssetThumb({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-inner",
        className,
      )}
    >
      {children}
    </div>
  );
}

function matchesExcludedSelfNft(
  exclude: { contractAddress: Address; tokenId: string } | undefined,
  contractAddress: Address,
  tokenId: string,
): boolean {
  if (!exclude) return false;
  if (getAddress(contractAddress) !== getAddress(exclude.contractAddress)) {
    return false;
  }
  try {
    return BigInt(tokenId) === BigInt(exclude.tokenId);
  } catch {
    return tokenId === exclude.tokenId;
  }
}

export function SendToUrnPanel({
  tbaAddress,
  chainName,
  explorerBaseUrl,
  excludeSendSelfNft,
  embedded = false,
}: SendToUrnPanelProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const publicClientFromHook = usePublicClient({
    chainId: CRYPTOURNS_CONTRACT.chainId,
  });

  const [activeTab, setActiveTab] = useState<"nfts" | "coins">("nfts");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastConfirmedTxHref, setLastConfirmedTxHref] = useState<string | null>(
    null,
  );
  const [tbaExcludedKeys, setTbaExcludedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [tbaLookupDone, setTbaLookupDone] = useState(false);

  const portfolioQuery = useQuery({
    queryKey: ["wallet-portfolio", address],
    queryFn: () => loadWalletPortfolioClient(address!),
    enabled: Boolean(address) && isConnected,
    staleTime: 60_000,
  });

  const outerClass = embedded
    ? "space-y-4"
    : "space-y-4 rounded-xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-sm";
  const disconnectedClass = embedded
    ? "space-y-4"
    : "rounded-xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur-sm";

  const ensureChain = useCallback(async () => {
    if (chainId === CRYPTOURNS_CONTRACT.chainId) return;
    if (!switchChainAsync) {
      throw new Error(`Switch to ${chainName} in your wallet to continue.`);
    }
    await switchChainAsync({ chainId: CRYPTOURNS_CONTRACT.chainId });
  }, [chainId, chainName, switchChainAsync]);

  const runTx = useCallback(
    async (fn: () => Promise<`0x${string}`>) => {
      setLastConfirmedTxHref(null);
      setBusy(true);
      try {
        await ensureChain();
        const hash = await fn();
        await waitForTransactionReceipt(wagmiConfig, { hash });
        void queryClient.invalidateQueries({ queryKey: ["wallet-portfolio"] });
        void queryClient.invalidateQueries({ queryKey: ["owned-cryptourns"] });
        setLastConfirmedTxHref(`${explorerBaseUrl}/tx/${hash}`);
        setConfirm(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        const friendly = /user rejected|denied|rejected the request/i.test(
          msg,
        )
          ? "Signature rejected in wallet."
          : /revert|failed/i.test(msg)
            ? "Transaction failed on-chain."
            : msg;
        toast.error(friendly);
      } finally {
        setBusy(false);
      }
    },
    [ensureChain, explorerBaseUrl, queryClient],
  );

  const data = portfolioQuery.data;

  useEffect(() => {
    const nfts = data?.nfts;
    if (!nfts?.length) {
      setTbaExcludedKeys(new Set());
      setTbaLookupDone(true);
      return;
    }

    let cancelled = false;
    setTbaLookupDone(false);

    void (async () => {
      const client =
        publicClientFromHook ??
        getPublicClient(wagmiConfig, {
          chainId: CRYPTOURNS_CONTRACT.chainId,
        });
      if (!client) {
        if (!cancelled) {
          setTbaExcludedKeys(new Set());
          setTbaLookupDone(true);
        }
        return;
      }
      try {
        const keys = await fetchNftKeysWhoseTbaEquals(
          client,
          nfts,
          tbaAddress,
          CRYPTOURNS_CONTRACT.chainId,
        );
        if (!cancelled) setTbaExcludedKeys(keys);
      } catch {
        if (!cancelled) setTbaExcludedKeys(new Set());
      } finally {
        if (!cancelled) setTbaLookupDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data?.nfts, publicClientFromHook, tbaAddress]);

  const sendableNfts = useMemo(() => {
    const list = data?.nfts ?? [];
    return list.filter((nft) => {
      if (tbaExcludedKeys.has(portfolioNftKey(nft))) return false;
      if (
        excludeSendSelfNft &&
        matchesExcludedSelfNft(
          excludeSendSelfNft,
          nft.contractAddress,
          nft.tokenId,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [data?.nfts, excludeSendSelfNft, tbaExcludedKeys]);

  useEffect(() => {
    if (!confirm || confirm.kind === "erc20") return;
    const nft = confirm.nft;
    if (tbaExcludedKeys.has(portfolioNftKey(nft))) {
      setConfirm(null);
      return;
    }
    if (
      excludeSendSelfNft &&
      matchesExcludedSelfNft(
        excludeSendSelfNft,
        nft.contractAddress,
        nft.tokenId,
      )
    ) {
      setConfirm(null);
    }
  }, [confirm, excludeSendSelfNft, tbaExcludedKeys]);

  const sendErc20 = useCallback(
    (contractAddress: Address, amount: bigint) =>
      void runTx(() =>
        writeContractAsync({
          address: contractAddress,
          abi: erc20TransferAbi,
          chainId: CRYPTOURNS_CONTRACT.chainId,
          functionName: "transfer",
          args: [tbaAddress, amount],
        }),
      ),
    [runTx, tbaAddress, writeContractAsync],
  );

  const sendErc721 = useCallback(
    (contractAddress: Address, tokenId: string) => {
      if (
        tbaExcludedKeys.has(
          portfolioNftKeyFromParts(contractAddress, tokenId),
        ) ||
        matchesExcludedSelfNft(excludeSendSelfNft, contractAddress, tokenId)
      ) {
        toast.error("You can't send this urn into its own vault.");
        return;
      }
      void runTx(() =>
        writeContractAsync({
          address: contractAddress,
          abi: erc721SafeTransferAbi,
          chainId: CRYPTOURNS_CONTRACT.chainId,
          functionName: "safeTransferFrom",
          args: [address!, tbaAddress, BigInt(tokenId)],
        }),
      );
    },
    [address, excludeSendSelfNft, runTx, tbaAddress, tbaExcludedKeys, writeContractAsync],
  );

  const sendErc1155 = useCallback(
    (contractAddress: Address, tokenId: string, amount: bigint) => {
      if (
        tbaExcludedKeys.has(
          portfolioNftKeyFromParts(contractAddress, tokenId),
        ) ||
        matchesExcludedSelfNft(excludeSendSelfNft, contractAddress, tokenId)
      ) {
        toast.error("You can't send this urn into its own vault.");
        return;
      }
      void runTx(() =>
        writeContractAsync({
          address: contractAddress,
          abi: erc1155SafeTransferAbi,
          chainId: CRYPTOURNS_CONTRACT.chainId,
          functionName: "safeTransferFrom",
          args: [address!, tbaAddress, BigInt(tokenId), amount, "0x"],
        }),
      );
    },
    [address, excludeSendSelfNft, runTx, tbaAddress, tbaExcludedKeys, writeContractAsync],
  );

  const coinCount = data?.erc20.length ?? 0;
  const nftCount = sendableNfts.length;

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value === "coins" ? "coins" : "nfts");
    setConfirm(null);
  }, []);

  if (!isConnected) {
    return (
      <div className={disconnectedClass}>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to pick tokens and NFTs from your account and send
          them to this urn in a few clicks.
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

  return (
    <div className={outerClass}>
      {portfolioQuery.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading your assets…
        </div>
      ) : portfolioQuery.isError ? (
        <p className="text-sm text-destructive">
          {portfolioQuery.error instanceof Error
            ? portfolioQuery.error.message
            : "Could not load assets."}
        </p>
      ) : data ? (
        confirm ? (
          <SendConfirmation
            key={confirmStateKey(confirm)}
            state={confirm}
            busy={busy}
            onBack={() => setConfirm(null)}
            onConfirmErc20={(row, amount) => sendErc20(row.contractAddress, amount)}
            onConfirm721={(nft) => sendErc721(nft.contractAddress, nft.tokenId)}
            onConfirm1155={(nft, qty) =>
              sendErc1155(nft.contractAddress, nft.tokenId, qty)
            }
          />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex flex-col gap-3"
          >
            <TabsList variant="line" className="grid h-9 w-full grid-cols-2">
              <TabsTrigger value="nfts">NFTs ({nftCount})</TabsTrigger>
              <TabsTrigger value="coins">Coins ({coinCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="coins" className="flex flex-col gap-3">
              <Erc20List
                items={data.erc20}
                busy={busy}
                onSelect={(row) => setConfirm({ kind: "erc20", row })}
              />
            </TabsContent>
            <TabsContent value="nfts" className="flex flex-col gap-3">
              {!tbaLookupDone && data.nfts.length > 0 ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Resolving vault links for your NFTs…
                </div>
              ) : sendableNfts.length === 0 && data.nfts.length > 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  This urn’s NFT can’t be sent into its own vault. Other NFTs
                  you own will show up here.
                </p>
              ) : (
                <NftUnifiedList
                  items={sendableNfts}
                  busy={busy}
                  onSelect721={(nft) => setConfirm({ kind: "nft721", nft })}
                  onSelect1155={(nft) => setConfirm({ kind: "nft1155", nft })}
                />
              )}
            </TabsContent>
          </Tabs>
        )
      ) : null}

      {lastConfirmedTxHref ? (
        <p className="text-xs text-muted-foreground">
          Confirmed.{" "}
          <a
            href={lastConfirmedTxHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            View on explorer
          </a>
        </p>
      ) : null}
    </div>
  );
}

function SendConfirmation({
  state,
  busy,
  onBack,
  onConfirmErc20,
  onConfirm721,
  onConfirm1155,
}: {
  state: ConfirmState;
  busy: boolean;
  onBack: () => void;
  onConfirmErc20: (row: Erc20PortfolioItemJson, amount: bigint) => void;
  onConfirm721: (nft: NftPortfolioItemJson) => void;
  onConfirm1155: (nft: NftPortfolioItemJson, qty: bigint) => void;
}) {
  const [amountStr, setAmountStr] = useState("");
  const [qtyStr, setQtyStr] = useState("1");

  if (state.kind === "erc20") {
    const row = state.row;
    const max = BigInt(row.balanceRaw);
    const formattedMax = formatUnits(max, row.decimals);
    const submit = () => {
      let parsed: bigint;
      try {
        parsed = parseUnits(amountStr.trim() || "0", row.decimals);
      } catch {
        return;
      }
      if (parsed <= BigInt(0) || parsed > max) return;
      onConfirmErc20(row, parsed);
    };
    return (
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          disabled={busy}
          onClick={onBack}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
        <div className="flex gap-3 rounded-xl border border-border/80 bg-card/50 p-3 shadow-sm">
          <ConfirmAssetThumb>
            <div className="flex size-full items-center justify-center bg-muted/80 text-sm font-bold tracking-tight text-foreground">
              {(row.symbol || "?").slice(0, 4).toUpperCase()}
            </div>
          </ConfirmAssetThumb>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{row.symbol}</p>
            {row.name ? (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {row.name}
              </p>
            ) : null}
            <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
              Balance {formattedMax}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="send-confirm-amount"
            className="text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
          >
            Amount
          </label>
          <Input
            id="send-confirm-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={busy}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={busy}
            onClick={() => setAmountStr(formattedMax)}
          >
            Use max
          </Button>
        </div>
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={busy}
          onClick={submit}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            "Confirm send"
          )}
        </Button>
      </div>
    );
  }

  if (state.kind === "nft721") {
    const nft = state.nft;
    const img = displayableNftImageUrl(nft.image);
    const title = nft.name?.trim() || `Token #${nft.tokenId}`;
    return (
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          disabled={busy}
          onClick={onBack}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Button>
        <div className="flex gap-3 rounded-xl border border-border/80 bg-card/50 p-3 shadow-sm">
          <ConfirmAssetThumb>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Coins className="size-7 opacity-45" aria-hidden />
              </div>
            )}
          </ConfirmAssetThumb>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-semibold leading-snug text-foreground">
              {title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nftConfirmSubtitle(nft)}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Sending{" "}
          <span className="font-medium tabular-nums text-foreground">1</span>{" "}
          ERC-721 to the vault.
        </p>
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={busy}
          onClick={() => onConfirm721(nft)}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            "Confirm send"
          )}
        </Button>
      </div>
    );
  }

  const nft = state.nft;
  const img = displayableNftImageUrl(nft.image);
  const title = nft.name?.trim() || `ID ${nft.tokenId}`;
  const max = BigInt(nft.balance);
  const submit1155 = () => {
    let n: bigint;
    try {
      n = BigInt(qtyStr);
    } catch {
      return;
    }
    if (n < BigInt(1) || n > max) return;
    onConfirm1155(nft, n);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        disabled={busy}
        onClick={onBack}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Button>
      <div className="flex gap-3 rounded-xl border border-border/80 bg-card/50 p-3 shadow-sm">
        <ConfirmAssetThumb>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Coins className="size-7 opacity-45" aria-hidden />
            </div>
          )}
        </ConfirmAssetThumb>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug text-foreground">
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {nftConfirmSubtitle(nft)}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
            You hold {nft.balance}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="send-confirm-qty1155"
          className="text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
        >
          Quantity
        </label>
        <Input
          id="send-confirm-qty1155"
          type="text"
          inputMode="numeric"
          value={qtyStr}
          onChange={(e) => setQtyStr(e.target.value)}
          disabled={busy}
          className="font-mono text-sm"
        />
      </div>
      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={busy}
        onClick={submit1155}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          "Confirm send"
        )}
      </Button>
    </div>
  );
}

function Erc20List({
  items,
  busy,
  onSelect,
}: {
  items: Erc20PortfolioItemJson[];
  busy: boolean;
  onSelect: (row: Erc20PortfolioItemJson) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No ERC-20 tokens found for this wallet on this network.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((row) => (
        <li key={row.contractAddress}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSelect(row)}
            className="flex w-full items-center gap-3 rounded-xl border border-border/80 bg-background/40 p-2.5 text-left transition-colors hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/60 text-xs font-semibold">
              {(row.symbol || "?").slice(0, 3).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{row.symbol}</p>
              {row.name ? (
                <p className="truncate text-xs text-muted-foreground">
                  {row.name}
                </p>
              ) : null}
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                Bal {formatUnits(BigInt(row.balanceRaw), row.decimals)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium text-primary">
              Select
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NftUnifiedList({
  items,
  busy,
  onSelect721,
  onSelect1155,
}: {
  items: NftPortfolioItemJson[];
  busy: boolean;
  onSelect721: (nft: NftPortfolioItemJson) => void;
  onSelect1155: (nft: NftPortfolioItemJson) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No NFTs found for this wallet on this network.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((nft) =>
        nft.standard === "ERC1155" ? (
          <Nft1155PickRow
            key={`${nft.contractAddress}-${nft.tokenId}`}
            nft={nft}
            busy={busy}
            onSelect={() => onSelect1155(nft)}
          />
        ) : (
          <Nft721PickRow
            key={`${nft.contractAddress}-${nft.tokenId}`}
            nft={nft}
            busy={busy}
            onSelect={() => onSelect721(nft)}
          />
        ),
      )}
    </ul>
  );
}

function Nft721PickRow({
  nft,
  busy,
  onSelect,
}: {
  nft: NftPortfolioItemJson;
  busy: boolean;
  onSelect: () => void;
}) {
  const img = displayableNftImageUrl(nft.image);
  return (
    <li>
      <button
        type="button"
        disabled={busy}
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-xl border border-border/80 bg-background/40 p-2.5 text-left transition-colors hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Coins className="size-6 opacity-35" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {nft.name ?? `Token #${nft.tokenId}`}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {nftCollectionLine(nft)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-primary">Select</span>
      </button>
    </li>
  );
}

function Nft1155PickRow({
  nft,
  busy,
  onSelect,
}: {
  nft: NftPortfolioItemJson;
  busy: boolean;
  onSelect: () => void;
}) {
  const img = displayableNftImageUrl(nft.image);
  return (
    <li>
      <button
        type="button"
        disabled={busy}
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-xl border border-border/80 bg-background/40 p-2.5 text-left transition-colors hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Coins className="size-6 opacity-35" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {nft.name ?? `ID ${nft.tokenId}`}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {nftCollectionLine(nft)} · ×{nft.balance}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-primary">Select</span>
      </button>
    </li>
  );
}
