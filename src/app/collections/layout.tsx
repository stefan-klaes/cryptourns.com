import type { ReactNode } from "react";

/** Always render fresh — avoids stale RSC payload / CDN caching surprises. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CollectionsLayout({ children }: { children: ReactNode }) {
  return children;
}
