"use client";

import { Check, Loader2, Shield, Sparkles } from "lucide-react";

import type { MintStep } from "@/hooks/useMint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MintProgressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: MintStep;
  errorMessage?: string | null;
  onComplete: () => void;
};

const STEPS = [
  { key: "verify", label: "Verify transaction", icon: Shield },
  { key: "waiting", label: "Waiting for confirmation", icon: Loader2 },
  { key: "done", label: "Minting complete", icon: Sparkles },
] as const;

const STEP_ORDER: Record<string, number> = {
  verify: 0,
  waiting: 1,
  done: 2,
};

function StepItem({
  label,
  icon: Icon,
  state,
  spin,
}: {
  label: string;
  icon: typeof Shield;
  state: "pending" | "active" | "complete";
  spin?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
          state === "pending" && "bg-muted text-muted-foreground",
          state === "active" && "bg-primary/15 text-primary",
          state === "complete" && "bg-emerald-500/15 text-emerald-500",
        )}
      >
        {state === "complete" ? (
          <Check className="size-4" />
        ) : (
          <Icon
            className={cn(
              "size-4",
              state === "active" && spin && "animate-spin",
              state === "active" && !spin && "animate-pulse",
            )}
          />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          state === "pending" && "text-muted-foreground",
          state === "active" && "font-medium text-foreground",
          state === "complete" && "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function MintProgressDialog({
  open,
  onOpenChange,
  step,
  errorMessage,
  onComplete,
}: MintProgressDialogProps) {
  const currentIndex = STEP_ORDER[step] ?? -1;

  const handleOpenChange = (value: boolean) => {
    if (!value && step !== "done" && step !== "error") return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={step === "done" || step === "error"}
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>
            {step === "done"
              ? "Mint successful"
              : step === "error"
                ? "Mint failed"
                : "Minting your urn"}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? "Your urn has been minted and is ready to view."
              : step === "error"
                ? (errorMessage ??
                  "Something went wrong. You can close this dialog and try again.")
                : "Please wait while we process your transaction."}
          </DialogDescription>
        </DialogHeader>

        {step === "error" ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        ) : (
          <div className="space-y-4 py-2">
            {STEPS.map(({ key, label, icon }, i) => {
              let state: "pending" | "active" | "complete";
              if (i < currentIndex) state = "complete";
              else if (i === currentIndex)
                state = key === "done" ? "complete" : "active";
              else state = "pending";

              const displayIcon =
                key === "waiting" && state === "active" ? Loader2 : icon;

              return (
                <StepItem
                  key={key}
                  label={label}
                  icon={displayIcon}
                  state={state}
                  spin={key === "waiting"}
                />
              );
            })}
          </div>
        )}

        {step === "done" && (
          <Button onClick={onComplete} className="w-full">
            View your urn
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
