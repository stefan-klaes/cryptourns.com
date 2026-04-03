import { cn } from "@/lib/utils";

export function UrnCrackOverlay({ className }: { className?: string }) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-foreground/35",
        className,
      )}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.35}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M8 12 L42 38 L28 52 L55 78 L88 62" opacity={0.9} />
      <path d="M92 18 L68 44 L78 58 L48 88" opacity={0.75} />
      <path d="M22 88 L38 62 L18 48 L32 22" opacity={0.6} />
      <path d="M52 8 L58 32 L44 28 L50 18" opacity={0.55} />
    </svg>
  );
}
