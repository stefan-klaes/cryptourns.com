"use client";

import { Box } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { displayableNftImageUrl } from "@/lib/wallet/displayableNftImageUrl";
import { cn } from "@/lib/utils";

type UrnPreviewImageProps = {
  urnId: number;
  alchemyImageRaw: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
};

export function UrnPreviewImage({
  urnId,
  alchemyImageRaw,
  alt,
  width,
  height,
  className,
  imgClassName,
}: UrnPreviewImageProps) {
  const apiPath = `/api/urn/${urnId}/image`;
  const alchemyPath = displayableNftImageUrl(alchemyImageRaw);

  const [apiFailed, setApiFailed] = useState(false);
  const [alchemyFailed, setAlchemyFailed] = useState(false);

  useEffect(() => {
    setApiFailed(false);
    setAlchemyFailed(false);
  }, [urnId, alchemyImageRaw]);

  const activeSrc =
    !apiFailed ? apiPath : alchemyPath && !alchemyFailed ? alchemyPath : null;

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      {activeSrc ? (
        <Image
          src={activeSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn("size-full", imgClassName)}
          unoptimized
          onError={() => {
            if (!apiFailed) setApiFailed(true);
            else setAlchemyFailed(true);
          }}
        />
      ) : (
        <div className="flex size-full min-h-0 items-center justify-center text-muted-foreground">
          <Box className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
