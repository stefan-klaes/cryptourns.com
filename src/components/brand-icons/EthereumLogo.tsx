import { cn } from "@/lib/utils";

import type { BrandIconProps } from "./types";

export function EthereumLogo({ className, ...props }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
      id="Layer_1"
      x="0px"
      y="0px"
      viewBox="0 0 512 512"
      xmlSpace="preserve"
      className={cn("size-4 fill-current", className)}
      {...props}
    >
      <g>
        <path d="M254.8,383.3L97.7,290.6L254.7,512L412,290.6L254.8,383.3L254.8,383.3z M257.2,0L100.1,260.7l157.1,92.9l157.2-92.8 L257.2,0z" />
      </g>
    </svg>
  );
}
