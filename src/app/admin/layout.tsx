import type { Route } from "next";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Admin
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Cryptourns</h1>
          <span className="text-sm text-amber-600/90 dark:text-amber-500/90">
            No authentication yet — do not expose this URL publicly.
          </span>
        </div>
        <nav className="mt-4 flex gap-4 text-sm">
          <Link
            href={"/admin/urns" as Route}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Urns
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
