"use client";

import { Check, Clock, Loader2, Shield, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type WithdrawProgressStep = "verify" | "waiting" | "done" | "error";

export type VaultTxProgressVariant = "withdraw" | "deposit";

const STEP_ORDER: Record<string, number> = {
  verify: 0,
  waiting: 1,
  done: 2,
};

const COPY: Record<
  VaultTxProgressVariant,
  {
    progressTitle: string;
    doneTitle: string;
    errorTitle: string;
    doneDescription: string;
    doneStepLabel: string;
  }
> = {
  withdraw: {
    progressTitle: "Sending from vault",
    doneTitle: "Transfer successful",
    errorTitle: "Transfer failed",
    doneDescription: "The asset has left the urn vault.",
    doneStepLabel: "Transfer complete",
  },
  deposit: {
    progressTitle: "Sending to vault",
    doneTitle: "Transfer successful",
    errorTitle: "Transfer failed",
    doneDescription: "The asset is now in this urn's vault.",
    doneStepLabel: "Deposit complete",
  },
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

type WithdrawProgressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: WithdrawProgressStep;
  errorMessage?: string | null;
  onComplete: () => void;
  variant?: VaultTxProgressVariant;
};

export function WithdrawProgressDialog({
  open,
  onOpenChange,
  step,
  errorMessage,
  onComplete,
  variant = "withdraw",
}: WithdrawProgressDialogProps) {
  const copy = COPY[variant];
  const steps = useMemo(
    () =>
      [
        { key: "verify", label: "Confirm in wallet", icon: Shield },
        { key: "waiting", label: "Waiting for confirmation", icon: Clock },
        {
          key: "done",
          label: copy.doneStepLabel,
          icon: Sparkles,
        },
      ] as const,
    [copy.doneStepLabel],
  );

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
              ? copy.doneTitle
              : step === "error"
                ? copy.errorTitle
                : copy.progressTitle}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? copy.doneDescription
              : step === "error"
                ? (errorMessage ??
                  "Something went wrong. You can close this dialog and try again.")
                : "Please wait while your wallet and the network process this transaction."}
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
            {steps.map(({ key, label, icon }, i) => {
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
            Done
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
