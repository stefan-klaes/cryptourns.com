"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncResponse = {
  ok?: boolean;
  error?: string;
  synced?: number;
  attempted?: number;
  failures?: { urnId: number; message: string }[];
};

export function SyncMissingUrnsButton({
  missingCount,
  disabled: disabledProp,
}: {
  missingCount: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const disabled =
    disabledProp || missingCount === 0 || status === "loading";

  async function sync() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/urns/sync-missing", {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as SyncResponse;
      if (!res.ok) {
        setStatus("err");
        setMessage(
          typeof data.error === "string" ? data.error : `HTTP ${res.status}`,
        );
        return;
      }
      const synced = data.synced ?? 0;
      const attempted = data.attempted ?? 0;
      const failures = data.failures ?? [];
      if (failures.length > 0) {
        setStatus("err");
        setMessage(
          `Synced ${synced}/${attempted}. Failed: ${failures
            .map((f) => `#${f.urnId}`)
            .join(", ")}`,
        );
        router.refresh();
        return;
      }
      setStatus("done");
      setMessage(
        attempted === 0
          ? "Nothing missing"
          : `Created or updated ${synced} urn${synced === 1 ? "" : "s"}`,
      );
      router.refresh();
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
        variant="secondary"
        disabled={disabled}
        onClick={sync}
      >
        {status === "loading"
          ? "Syncing missing…"
          : "Create DB rows for missing"}
      </Button>
      {status === "done" && message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
      {status === "err" && message ? (
        <span className="text-xs text-destructive">{message}</span>
      ) : null}
    </div>
  );
}
