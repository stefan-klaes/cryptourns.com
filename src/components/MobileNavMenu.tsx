"use client";

import type { LucideIcon } from "lucide-react";
import { Menu } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";

import { CryptournLogo } from "@/components/CryptournLogo";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type MobileNavMenuItem = {
  href: Route | "/";
  label: string;
  icon: LucideIcon;
};

type MobileNavMenuProps = {
  items: readonly MobileNavMenuItem[];
};

const tabTriggerClass =
  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors";

export function MobileNavMenu({ items }: MobileNavMenuProps) {
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
          aria-label="Open menu"
        >
          <Menu className="size-6 shrink-0 stroke-[1.75]" aria-hidden />
          <span className="max-w-full truncate text-center text-[0.65rem] font-semibold leading-none tracking-tight">
            Menu
          </span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1.5 p-3 text-left">
          <div className="flex flex-col gap-1">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/" />}
                className="h-auto justify-start gap-2 px-2 py-1.5 font-semibold"
              >
                <CryptournLogo className="size-6 shrink-0" />
                Cryptourns
              </Button>
            </DrawerClose>
            <DrawerTitle className="px-2 text-xs font-medium text-muted-foreground">
              Menu
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <nav
          className="grid grid-cols-2 gap-1.5 px-3 pb-4"
          aria-label="Site menu"
        >
          {items.map(({ href, label, icon: Icon }) => (
            <DrawerClose key={`${href}-${label}`} asChild>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={href as Route} />}
                className="h-auto min-h-0 w-full justify-start gap-2 whitespace-normal py-2 font-normal"
              >
                <Icon
                  className="size-3.5 shrink-0 stroke-[1.75] opacity-80"
                  aria-hidden
                />
                <span className="line-clamp-2 text-left leading-snug">
                  {label}
                </span>
              </Button>
            </DrawerClose>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
