import type { Metadata } from "next";

import { AccountPageClient } from "@/components/account/AccountPageClient";

export const metadata: Metadata = {
  title: "Account | Cryptourns",
  description:
    "View Cryptourns in your wallet and manage referral earnings from mint links.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <AccountPageClient />
    </main>
  );
}
