import type { Metadata } from "next";

import { EarningsPageClient } from "@/components/earnings/EarningsPageClient";

export const metadata: Metadata = {
  title: "Referral earnings | Cryptourns",
  description:
    "Share your Cryptourns mint link and claim your on-chain referral earnings.",
};

export default function EarningsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <EarningsPageClient />
    </main>
  );
}
