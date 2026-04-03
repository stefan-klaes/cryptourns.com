import type { Metadata } from "next";

import { WhitepaperPage } from "@/components/whitepaper/WhitepaperPage";

export const metadata: Metadata = {
  title: "Whitepaper | Cryptourns",
  description:
    "How Cryptourns works: token-bound urns, burying floor NFTs and dust, candles, cracked vaults, collections, referrals, and risks.",
};

export default function WhitepaperRoute() {
  return <WhitepaperPage />;
}
