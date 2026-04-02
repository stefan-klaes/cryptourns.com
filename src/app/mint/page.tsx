import { Suspense } from "react";

import { MintPageClient } from "@/components/mint/MintPageClient";

export default function MintPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="mx-auto h-80 max-w-xs w-full animate-pulse rounded-lg bg-muted md:max-w-none" />
            <div className="space-y-6">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        }
      >
        <MintPageClient />
      </Suspense>
    </main>
  );
}

