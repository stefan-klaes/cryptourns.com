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
  onComplete,
}: MintProgressDialogProps) {
  const currentIndex = STEP_ORDER[step] ?? -1;

  const handleOpenChange = (value: boolean) => {
    // Only allow closing when minting is done
    if (!value && step !== "done") return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={step === "done"} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "done" ? "Mint successful" : "Minting your urn"}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? "Your urn has been minted and is ready to view."
              : "Please wait while we process your transaction."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {STEPS.map(({ key, label, icon }, i) => {
            let state: "pending" | "active" | "complete";
            if (i < currentIndex) state = "complete";
            else if (i === currentIndex) state = key === "done" ? "complete" : "active";
            else state = "pending";

            // The "done" step should use Sparkles (no spin), override active → complete
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

        {step === "done" && (
          <Button onClick={onComplete} className="w-full">
            View your urn
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
