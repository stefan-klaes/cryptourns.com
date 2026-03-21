"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MintStep = "idle" | "verify" | "waiting" | "done";

export function useMint() {
  const [step, setStep] = useState<MintStep>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const mint = useCallback(() => {
    clearTimers();
    setStep("verify");

    const t1 = setTimeout(() => setStep("waiting"), 2_000);
    const t2 = setTimeout(() => setStep("done"), 4_500);
    timers.current = [t1, t2];
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setStep("idle");
  }, [clearTimers]);

  return {
    step,
    isOpen: step !== "idle",
    mint,
    reset,
  };
}
