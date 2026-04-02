"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { ResponsiveSheet } from "@/components/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import {
  buildLightCandleMessage,
  buildUnlightCandleMessage,
} from "@/lib/urn/lightCandleMessage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CandlesApiGet = { count: number; litByMe: boolean };
type CandlesApiLight = {
  count: number;
  litByMe: boolean;
  alreadyLit?: boolean;
};
type CandlesApiRemove = {
  count: number;
  litByMe: boolean;
  alreadyRemoved?: boolean;
};

type LightCandleButtonProps = {
  urnId: number;
  initialCount: number;
  className?: string;
};

export function LightCandleButton({
  urnId,
  initialCount,
  className,
}: LightCandleButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localOverride, setLocalOverride] = useState<{
    count: number;
    litByMe: boolean;
  } | null>(null);
  const candlesQuery = useQuery({
    queryKey: ["urn-candles", urnId, address ?? ""],
    queryFn: async (): Promise<CandlesApiGet> => {
      const params = new URLSearchParams();
      if (address) params.set("address", address);
      const res = await fetch(`/api/urn/${urnId}/candles?${params}`);
      if (!res.ok) {
        throw new Error("Failed to load candles");
      }
      return res.json() as Promise<CandlesApiGet>;
    },
    enabled: sheetOpen,
  });

  /** Server `initialCount` from RSC; `localOverride` after light/remove on this session. */
  const triggerCount = localOverride?.count ?? initialCount;
  const triggerCountFormatted = triggerCount.toLocaleString("en-US");

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["urn-candles", urnId] });
  }, [queryClient, urnId]);

  const chainId = getCryptournsChainConfig().chainId;

  const lightMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      const message = buildLightCandleMessage(urnId, chainId);
      const signature = await signMessageAsync({ message });
      const res = await fetch(`/api/urn/${urnId}/candles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const data = (await res.json()) as CandlesApiLight & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not light candle");
      }
      return data;
    },
    onSuccess: (data) => {
      setLocalOverride({ count: data.count, litByMe: data.litByMe });
      invalidate();
      router.refresh();
      setSheetOpen(false);
      if (data.alreadyLit) {
        toast.message("You already lit a candle for this urn");
      } else {
        toast.success("Candle lit");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      const message = buildUnlightCandleMessage(urnId, chainId);
      const signature = await signMessageAsync({ message });
      const res = await fetch(`/api/urn/${urnId}/candles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, intent: "remove" }),
      });
      const data = (await res.json()) as CandlesApiRemove & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not remove candle");
      }
      return data;
    },
    onSuccess: (data) => {
      setLocalOverride({ count: data.count, litByMe: data.litByMe });
      invalidate();
      router.refresh();
      setSheetOpen(false);
      if (data.alreadyRemoved) {
        toast.message("No candle to remove");
      } else {
        toast.success("Candle removed");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const pending = lightMutation.isPending || removeMutation.isPending;

  const sheetLitForFooter =
    localOverride?.litByMe ?? candlesQuery.data?.litByMe ?? false;
  const sheetStatusLoading =
    sheetOpen && isConnected && candlesQuery.isPending && !localOverride;

  const footer = !isConnected ? (
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={() => openConnectModal?.()}
    >
      Connect wallet
    </Button>
  ) : candlesQuery.isError ? (
    <p className="text-destructive text-center text-sm">
      Could not load candle status. Close and try again.
    </p>
  ) : sheetStatusLoading ? (
    <Button type="button" className="w-full" size="lg" disabled>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Checking…
    </Button>
  ) : sheetLitForFooter ? (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        size="lg"
        disabled={pending}
        onClick={() => removeMutation.mutate()}
      >
        {removeMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Waiting for signature…
          </>
        ) : (
          "Remove my candle"
        )}
      </Button>
    </div>
  ) : (
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={pending}
      onClick={() => lightMutation.mutate()}
    >
      {lightMutation.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Waiting for signature…
        </>
      ) : (
        <>
          <Flame className="size-4" aria-hidden />
          Light a candle
        </>
      )}
    </Button>
  );

  const openSheet = () => {
    setSheetOpen(true);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="default"
        className={cn(
          "max-w-full gap-3 rounded-full border-amber-500/40 bg-amber-500/[0.07] shadow-sm",
          "text-foreground hover:border-amber-500/55 hover:bg-amber-500/[0.12]",
          "dark:border-amber-400/35 dark:bg-amber-400/[0.1] dark:hover:border-amber-400/50 dark:hover:bg-amber-400/[0.15]",
        )}
        onClick={openSheet}
        aria-label={`Light a candle · ${triggerCountFormatted} lit`}
      >
        {pending ? (
          <Loader2
            className="size-5 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
            aria-hidden
          />
        ) : (
          <Flame
            className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
        )}
        <span className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left">
          <span className="truncate text-sm font-semibold tracking-tight">
            Light a candle
          </span>
          <span
            className="shrink-0 text-sm font-semibold tabular-nums text-amber-800 dark:text-amber-200"
            aria-hidden
          >
            {triggerCountFormatted}
          </span>
        </span>
      </Button>

      {sheetOpen ? (
        <ResponsiveSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={sheetLitForFooter ? "Your candle" : "Light a candle"}
          description={
            sheetLitForFooter
              ? "You are showing respect for this urn on the gallery."
              : "Show respect for this urn—no gas, no transaction."
          }
          footer={footer}
        >
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Lighting a candle is a small way to honor this Cryptourn and its
              token-bound vault on the shared gallery.
            </p>
            <p>
              Each lit candle adds a yellow pixel to the urn artwork used on
              this site—the preview image updates for everyone as the total
              grows.
            </p>
            {sheetLitForFooter ? (
              <p>
                You can remove your candle anytime; it lowers the count and
                updates the image again.
              </p>
            ) : null}
            <div className="text-muted-foreground rounded-xl border border-border/80 bg-muted/40 px-3.5 py-3 text-xs leading-relaxed">
              <p className="font-medium text-foreground">
                Wallet signature only
              </p>
              <p className="mt-1.5">
                We ask you to sign a short message so we can verify your wallet
                address. It does not send a blockchain transaction, does not
                cost gas, and does not move funds—only proves it is you.
                {sheetLitForFooter
                  ? " Removing your candle uses the same kind of signature."
                  : null}
              </p>
            </div>
          </div>
        </ResponsiveSheet>
      ) : null}
    </div>
  );
}
