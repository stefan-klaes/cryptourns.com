"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

import { AddressRow } from "@/components/mint/AddressRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddressListProps = {
  connectedAddress: Address | undefined;
  addresses: Address[];
  onAdd: (address: Address) => void;
  onRemove: (index: number) => void;
};

export function AddressList({
  connectedAddress,
  addresses,
  onAdd,
  onRemove,
}: AddressListProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (isAddress(trimmed)) {
      const checksummed = getAddress(trimmed);
      const normalized = checksummed.toLowerCase();
      if (addresses.some((a) => a.toLowerCase() === normalized)) {
        setError("Address already added");
        return;
      }
      onAdd(checksummed);
      setInput("");
      setError("");
      return;
    }

    setResolving(true);
    setError("");
    try {
      const res = await fetch("/api/ens/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data: unknown = await res.json().catch(() => null);
      const addrRaw =
        res.ok &&
        data &&
        typeof data === "object" &&
        "address" in data &&
        typeof (data as { address: unknown }).address === "string"
          ? (data as { address: string }).address
          : null;
      const resolved =
        addrRaw && isAddress(addrRaw) ? getAddress(addrRaw) : null;
      const message =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Could not resolve ENS name";

      if (!resolved) {
        setError(message);
        return;
      }

      const normalized = resolved.toLowerCase();
      if (addresses.some((a) => a.toLowerCase() === normalized)) {
        setError("Address already added");
        return;
      }

      onAdd(resolved);
      setInput("");
    } catch {
      setError("ENS lookup failed");
    } finally {
      setResolving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
        Mint to
      </label>

      <div className="space-y-2">
        {addresses.map((address, i) => (
          <AddressRow
            key={address}
            address={address}
            isYou={
              connectedAddress !== undefined &&
              address.toLowerCase() === connectedAddress.toLowerCase()
            }
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            placeholder="0x… or name.eth"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 font-mono text-sm"
            disabled={resolving}
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void handleAdd()}
            disabled={!input.trim() || resolving}
          >
            <Plus data-icon="inline-start" />
            {resolving ? "…" : "Add"}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
