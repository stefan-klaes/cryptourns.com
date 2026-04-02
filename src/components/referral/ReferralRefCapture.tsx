"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  REFERRAL_SESSION_KEY,
  parseReferralAddress,
} from "@/lib/referral/referralSession";

/** Persists a valid `?ref=` from any page into sessionStorage for mint. */
export function ReferralRefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = parseReferralAddress(searchParams.get("ref"));
    if (!ref) return;
    try {
      sessionStorage.setItem(REFERRAL_SESSION_KEY, ref);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  return null;
}
