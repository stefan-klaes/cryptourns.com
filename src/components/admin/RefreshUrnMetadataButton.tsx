"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function RefreshUrnMetadataButton({ urnId }: { urnId: number }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(`/api/urn/${urnId}/refresh`);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        assetCount?: number;
      };
      if (!res.ok) {
        setStatus("err");
        setMessage(
          typeof data.error === "string" ? data.error : `HTTP ${res.status}`,
        );
        return;
      }
      setStatus("ok");
      setMessage(
        typeof data.assetCount === "number"
          ? `${data.assetCount} assets`
          : "Done",
      );
    } catch {
      setStatus("err");
      setMessage("Network error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={status === "loading"}
        onClick={refresh}
      >
        {status === "loading" ? "Refreshing…" : "Refresh metadata"}
      </Button>
      {status === "ok" && message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
      {status === "err" && message ? (
        <span className="text-xs text-destructive">{message}</span>
      ) : null}
    </div>
  );
}
