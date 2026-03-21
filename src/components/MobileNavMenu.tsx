"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type MobileNavMenuLink = {
  href: string;
  label: string;
};

type MobileNavMenuProps = {
  links: readonly MobileNavMenuLink[];
};

const tabTriggerClass =
  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors";

const drawerLinkClass =
  "rounded-lg px-3 py-3 text-left text-base font-medium text-foreground hover:bg-muted";

export function MobileNavMenu({ links }: MobileNavMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            tabTriggerClass,
            open && "text-foreground",
          )}
          aria-label="Menü"
        >
          <Menu className="size-6 shrink-0 stroke-[1.75]" aria-hidden />
          <span className="max-w-full truncate text-center text-[0.65rem] font-semibold leading-none tracking-tight">
            Menü
          </span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Menü</DrawerTitle>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 px-4 pb-8" aria-label="Menü">
          <DrawerClose asChild>
            <Link href="/" className={drawerLinkClass}>
              Home
            </Link>
          </DrawerClose>
          {links.map(({ href, label }) => (
            <DrawerClose key={href} asChild>
              <Link href={href} className={drawerLinkClass}>
                {label}
              </Link>
            </DrawerClose>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
