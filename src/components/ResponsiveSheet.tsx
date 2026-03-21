"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

export type ResponsiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Pinned to the bottom of the panel; scrollable content stays above. */
  footer?: ReactNode;
  title?: string;
  description?: string;
  sheetSide?: "top" | "right" | "bottom" | "left";
  sheetContentClassName?: string;
  drawerContentClassName?: string;
  footerClassName?: string;
  showSheetCloseButton?: boolean;
};

const footerShell =
  "shrink-0 border-border border-t bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground";

export function ResponsiveSheet({
  open,
  onOpenChange,
  children,
  footer,
  title,
  description,
  sheetSide = "right",
  sheetContentClassName,
  drawerContentClassName,
  footerClassName,
  showSheetCloseButton = true,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={sheetSide}
          showCloseButton={showSheetCloseButton}
          className={cn(
            "min-h-0 gap-0 sm:max-w-md",
            sheetContentClassName,
          )}
        >
          {title ? (
            <SheetHeader className="shrink-0 text-left">
              <SheetTitle>{title}</SheetTitle>
              {description ? (
                <SheetDescription>{description}</SheetDescription>
              ) : null}
            </SheetHeader>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pt-2 text-foreground">
            {children}
          </div>
          {footer ? (
            <div className={cn(footerShell, footerClassName)}>{footer}</div>
          ) : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "flex max-h-[85vh] min-h-0 flex-col",
          drawerContentClassName,
        )}
      >
        {title ? (
          <DrawerHeader className="relative shrink-0 border-border border-b !text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </DrawerHeader>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pt-2 text-foreground">
          {children}
        </div>
        {footer ? (
          <div className={cn(footerShell, footerClassName)}>{footer}</div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
