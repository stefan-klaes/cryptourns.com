"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";

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

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!isAddress(trimmed)) {
      setError("Invalid Ethereum address");
      return;
    }

    const normalized = trimmed.toLowerCase();
    if (addresses.some((a) => a.toLowerCase() === normalized)) {
      setError("Address already added");
      return;
    }

    onAdd(trimmed as Address);
    setInput("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
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
            placeholder="0x…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleAdd}
            disabled={!input.trim()}
          >
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
