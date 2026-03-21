import { cn } from "@/lib/utils";

export function UrnPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.2),_transparent_45%),linear-gradient(160deg,_hsl(var(--background)),_hsl(var(--background))_40%,_hsl(var(--primary)/0.08))]" />
      <div className="absolute inset-x-10 top-10 h-28 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent" />

      <svg
        viewBox="0 0 240 320"
        className="relative z-10 w-[44%] text-foreground"
        aria-hidden
      >
        <defs>
          <linearGradient id="urn-fill" x1="72" y1="28" x2="176" y2="290" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0.98" />
            <stop offset="0.45" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="urn-shine" x1="92" y1="78" x2="92" y2="254" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0.34" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="urn-shadow" x="0" y="0" width="240" height="320" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="black" floodOpacity="0.22" />
          </filter>
        </defs>

        <g filter="url(#urn-shadow)">
          <ellipse cx="120" cy="283" rx="62" ry="10" fill="black" fillOpacity="0.18" />

          <path
            d="M78 108c-19 1-33 17-33 40 0 20 10 34 24 34 9 0 17-7 19-19l-10-3c-2 7-6 10-10 10-6 0-11-8-11-20 0-15 8-27 22-29l-1-13Z"
            fill="url(#urn-fill)"
            fillOpacity="0.9"
          />
          <path
            d="M162 108c19 1 33 17 33 40 0 20-10 34-24 34-9 0-17-7-19-19l10-3c2 7 6 10 10 10 6 0 11-8 11-20 0-15-8-27-22-29l1-13Z"
            fill="url(#urn-fill)"
            fillOpacity="0.9"
          />

          <ellipse cx="120" cy="36" rx="28" ry="14" fill="url(#urn-fill)" />
          <path d="M106 44h28v14c0 4-4 7-8 7h-12c-4 0-8-3-8-7V44Z" fill="url(#urn-fill)" />
          <path d="M83 64h74l8 16H75l8-16Z" fill="url(#urn-fill)" />
          <rect x="68" y="80" width="104" height="16" rx="6" fill="url(#urn-fill)" />
          <path d="M82 96h76l-9 24H91l-9-24Z" fill="url(#urn-fill)" />

          <path
            d="M92 120c-18 42-25 77-25 113 0 18 6 34 15 48h76c9-14 15-30 15-48 0-36-7-71-25-113H92Z"
            fill="url(#urn-fill)"
          />
          <path
            d="M97 126c-13 34-18 67-18 104 0 13 4 26 10 39h19c-7-18-11-39-11-64 0-28 5-54 14-79H97Z"
            fill="url(#urn-shine)"
          />

          <path d="M88 281h64l10 16H78l10-16Z" fill="url(#urn-fill)" />
          <rect x="64" y="297" width="112" height="12" rx="6" fill="url(#urn-fill)" />

          <path
            d="M105 148c5-4 10-6 15-6s10 2 15 6"
            fill="none"
            stroke="white"
            strokeOpacity="0.38"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M98 172c7-5 14-8 22-8 8 0 15 3 22 8"
            fill="none"
            stroke="white"
            strokeOpacity="0.24"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M68 80h104M82 96h76M92 120h56M88 281h64"
            fill="none"
            stroke="black"
            strokeOpacity="0.12"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </g>
      </svg>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Preview
        </p>
      </div>
    </div>
  );
}
