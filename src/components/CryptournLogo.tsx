import Image from "next/image";

import { cn } from "@/lib/utils";

type CryptournLogoProps = {
  className?: string;
};

export function CryptournLogo({ className }: CryptournLogoProps) {
  return (
    <Image
      src="/cryptourn-logo.png"
      alt=""
      width={200}
      height={200}
      className={cn("object-contain", className)}
      priority
    />
  );
}
