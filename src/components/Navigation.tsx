"use client";

import type { LucideIcon } from "lucide-react";
import { Box, CirclePlus, HandCoins, Layers, Newspaper } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CryptournLogo } from "@/components/CryptournLogo";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/urns", label: "Urns", icon: Box },
  { href: "/collections", label: "Collections", icon: Layers },
  { href: "/mint", label: "Mint", icon: CirclePlus },
  { href: "/earn", label: "Earn", icon: HandCoins },
  { href: "/feed", label: "Feed", icon: Newspaper },
] as const satisfies readonly {
  href: Route;
  label: string;
  icon: LucideIcon;
}[];

function NavLink({
  href,
  label,
  className,
}: {
  href: Route;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
    </Link>
  );
}

function MobileTabLink({
  href,
  label,
  icon: Icon,
}: {
  href: Route;
  label: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2",
        "transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-6 shrink-0 stroke-[1.75]" aria-hidden />
      <span className="max-w-full truncate text-center text-[0.65rem] font-semibold leading-none tracking-tight">
        {label}
      </span>
    </Link>
  );
}

export function Navigation() {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 z-50 backdrop-blur-md",
        "bottom-0 border-t border-border bg-background/95",
        "md:top-0 md:bottom-auto md:border-t-0 md:border-b md:bg-background/80",
      )}
    >
      <div className="mx-auto hidden h-14 max-w-6xl items-center justify-between gap-6 px-4 md:flex">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-90"
        >
          <CryptournLogo className="size-6" />
          <span className="text-sm font-semibold tracking-tight">Cryptourns</span>
        </Link>
        <div className="flex flex-1 items-center justify-center gap-8">
          {NAV_ITEMS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
        </div>
        <WalletConnectButton variant="desktop" />
      </div>

      <div className="flex w-full items-stretch px-1 pt-0.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden">
        <MobileNavMenu
          links={NAV_ITEMS.map(({ href, label }) => ({ href, label }))}
        />
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <MobileTabLink key={href} href={href} label={label} icon={icon} />
        ))}
        <WalletConnectButton />
      </div>
    </nav>
  );
}
