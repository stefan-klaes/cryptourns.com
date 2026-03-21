"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";

import { EthereumLogo } from "@/components/brand-icons";
import { ResponsiveSheet } from "@/components/ResponsiveSheet";
import { Button } from "@/components/ui/button";
import { formatEthereum } from "@/lib/utils/formatEthereum";

function WalletAddressRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
        {address}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label="Copy address"
        title="Copy"
        onClick={handleCopy}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

export function WalletDetailSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });

  useEffect(() => {
    if (!isConnected) {
      onOpenChange(false);
    }
  }, [isConnected, onOpenChange]);

  if (!isConnected || !address) {
    return null;
  }

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Wallet"
      description="Connected account and balance."
      footer={
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      }
    >
      <div className="space-y-4 text-foreground">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Address
          </p>
          <WalletAddressRow key={`${open}-${address}`} address={address} />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Balance
          </p>
          {balanceLoading ? (
            <p className="text-sm font-medium text-foreground">…</p>
          ) : balance ? (
            <div className="flex min-w-0 items-center gap-2">
              <EthereumLogo
                aria-hidden
                className="size-4 shrink-0 fill-current text-foreground"
              />
              <span className="min-w-0 truncate text-sm font-medium tabular-nums text-foreground">
                {formatEthereum(balance.value, 4, balance.decimals)}
              </span>
            </div>
          ) : (
            <p className="text-sm font-medium text-foreground">—</p>
          )}
        </div>
      </div>
    </ResponsiveSheet>
  );
}
