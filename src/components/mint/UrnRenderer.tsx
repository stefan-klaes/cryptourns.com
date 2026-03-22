"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { urnPixelArray, RIP_TEXT_COORDS } from "@/lib/urn/urnShape";
import { computeRomanCoords } from "@/lib/urn/romanNumerals";

const URN_COLOR_FAMILIES = [
  { hueMin: 8, hueMax: 24, satMin: 58, satMax: 78 },
  { hueMin: 26, hueMax: 42, satMin: 54, satMax: 74 },
  { hueMin: 190, hueMax: 216, satMin: 40, satMax: 62 },
  { hueMin: 126, hueMax: 152, satMin: 32, satMax: 54 },
  { hueMin: 256, hueMax: 286, satMin: 34, satMax: 58 },
  { hueMin: 336, hueMax: 356, satMin: 34, satMax: 56 },
  { hueMin: 210, hueMax: 232, satMin: 12, satMax: 26 },
];

type HslColor = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

function toHsl({ h, s, l }: HslColor) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function hashStringToSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface UrnRendererProps {
  assetCount: number;
  candleCount: number;
  className?: string;
  seed?: string | number;
}

export function UrnRenderer({
  assetCount,
  candleCount,
  className,
  seed,
}: UrnRendererProps) {
  const seedId = useId();
  const resolvedSeed = seed ?? seedId;

  const svgContent = useMemo(() => {
    type CellType = "transparent" | "urn" | "sockel" | "candles";

    const rng = mulberry32(hashStringToSeed(String(resolvedSeed)));
    const size = 600;
    const cellSize = size / 60;
    const gridSize = 60;
    const pixel = urnPixelArray();

    const urnFamily =
      URN_COLOR_FAMILIES[Math.floor(rng() * URN_COLOR_FAMILIES.length)];
    const urnHue = randomBetween(rng, urnFamily.hueMin, urnFamily.hueMax);
    const urnSaturation = randomBetween(rng, urnFamily.satMin, urnFamily.satMax);
    const gradientMode = ["vertical", "horizontal", "angled"][
      Math.floor(rng() * 3)
    ] as "vertical" | "horizontal" | "angled";
    const gradientAngle =
      gradientMode === "vertical"
        ? Math.PI / 2
        : gradientMode === "horizontal"
          ? 0
          : randomBetween(rng, 0, Math.PI * 2);
    const gradientVector = {
      x: Math.cos(gradientAngle),
      y: Math.sin(gradientAngle),
    };
    const projectionRange = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ].map(({ x, y }) => x * gradientVector.x + y * gradientVector.y);
    const minProjection = Math.min(...projectionRange);
    const maxProjection = Math.max(...projectionRange);
    const lightStart = randomBetween(rng, 56, 68);
    const lightEnd = lightStart - randomBetween(rng, 18, 30);
    const hueDrift = randomBetween(rng, -12, 12);
    const saturationDrift = randomBetween(rng, -10, 10);
    const backgroundHue = (urnHue + randomBetween(rng, -18, 18) + 360) % 360;
    const backgroundSaturation = randomBetween(rng, 6, 16);
    const pedestalHue = (urnHue + randomBetween(rng, -8, 8) + 360) % 360;
    const pedestalSaturation = clamp(urnSaturation * randomBetween(rng, 0.35, 0.55), 12, 34);
    const pedestalLightness = randomBetween(rng, 16, 24);
    const candleHue = randomBetween(rng, 42, 58);
    const isDarkUrnVariant = rng() < 0.5;

    const getGradientT = (x: number, y: number) => {
      const nx = x / (gridSize - 1);
      const ny = y / (gridSize - 1);
      const projection = nx * gradientVector.x + ny * gradientVector.y;
      return (projection - minProjection) / (maxProjection - minProjection);
    };

    const getUrnColor = (x: number, y: number) => {
      const t = getGradientT(x, y);
      const isTopUrnRow = y === 3;
      const lightnessBase =
        lightStart + (lightEnd - lightStart) * t + randomBetween(rng, -2.5, 2.5);
      const saturationBase =
        urnSaturation +
        saturationDrift * (t - 0.5) +
        randomBetween(rng, -4, 4);
      const hueBase =
        urnHue + hueDrift * (t - 0.5) + randomBetween(rng, -3, 3);
      const variantLightness = isDarkUrnVariant
        ? clamp(13 - t * 7 + randomBetween(rng, -1.5, 1.5), 3, 18)
        : lightnessBase + randomBetween(rng, -1.5, 1.5);
      const variantSaturation = isDarkUrnVariant
        ? clamp(saturationBase * 0.68 + randomBetween(rng, -3, 3), 12, 52)
        : clamp(saturationBase, 18, 90);

      return toHsl({
        h: (hueBase + 360) % 360,
        s: variantSaturation,
        l: clamp(
          variantLightness + (isTopUrnRow ? (isDarkUrnVariant ? -6 : -16) : 0),
          isDarkUrnVariant ? 2 : 14,
          isDarkUrnVariant ? 20 : 78,
        ),
      });
    };

    const getBackgroundColor = () =>
      toHsl({
        h: (backgroundHue + randomBetween(rng, -4, 4) + 360) % 360,
        s: clamp(backgroundSaturation + randomBetween(rng, -3, 3), 0, 24),
        l: clamp(randomBetween(rng, 94, 99), 90, 100),
      });

    const getCandleColor = () =>
      toHsl({
        h: (candleHue + randomBetween(rng, -7, 7) + 360) % 360,
        s: clamp(randomBetween(rng, 76, 98), 0, 100),
        l: clamp(randomBetween(rng, 44, 64), 0, 100),
      });

    // Build pixel grid
    const pixelGrid: CellType[][] = Array.from({ length: 61 }, () =>
      Array<CellType>(61).fill("transparent"),
    );
    const pedestalBounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };

    let row = 0;
    for (const p of pixel) {
      row++;
      const parts = p.split("-");
      const start = parseInt(parts[1]);
      const end = parseInt(parts[2]);
      for (let k = start - 1; k <= end; k++) {
        if (parts[0] === "urn") {
          pixelGrid[row][k + 1] = "urn";
        } else if (parts[0] === "sockel") {
          pixelGrid[row][k + 1] = "sockel";
          pedestalBounds.minX = Math.min(pedestalBounds.minX, k);
          pedestalBounds.maxX = Math.max(pedestalBounds.maxX, k);
          pedestalBounds.minY = Math.min(pedestalBounds.minY, row - 1);
          pedestalBounds.maxY = Math.max(pedestalBounds.maxY, row - 1);
        }
      }
    }

    const getPedestalColor = (x: number, y: number, variant: "base" | "text" = "base") => {
      const width = Math.max(pedestalBounds.maxX - pedestalBounds.minX, 1);
      const height = Math.max(pedestalBounds.maxY - pedestalBounds.minY, 1);
      const nx = (x - pedestalBounds.minX) / width;
      const ny = (y - pedestalBounds.minY) / height;
      const centerLift = 1 - Math.min(Math.abs(nx - 0.5) * 2, 1);
      const topLift = 1 - ny;
      const edgeShade = Math.abs(nx - 0.5) * 10;
      const baseLightness =
        pedestalLightness + centerLift * 6 + topLift * 5 - edgeShade;
      const variantBaseLightness = isDarkUrnVariant
        ? 10 + centerLift * 3 + topLift * 2 - ny * 2
        : baseLightness;

      return toHsl({
        h: (pedestalHue + randomBetween(rng, -3, 3) + 360) % 360,
        s: clamp(
          (isDarkUrnVariant
            ? urnSaturation * 0.72 + centerLift * 3 - ny * 2
            : pedestalSaturation + centerLift * 4 - ny * 4) +
            randomBetween(rng, -2, 2),
          isDarkUrnVariant ? 20 : 10,
          isDarkUrnVariant ? 60 : 38,
        ),
        l: clamp(
          variantBaseLightness +
            (variant === "text"
              ? isDarkUrnVariant
                ? -3
                : -10
              : 0) +
            randomBetween(rng, -1.5, 1.5),
          variant === "text"
            ? isDarkUrnVariant
              ? 3
              : 6
            : isDarkUrnVariant
              ? 6
              : 10,
          variant === "text"
            ? isDarkUrnVariant
              ? 16
              : 22
            : isDarkUrnVariant
              ? 20
              : 34,
        ),
      });
    };

    // Compute free coordinates for candles
    const freeCoordinates: string[] = [];
    if (candleCount > 0) {
      let freerow = 0;
      for (const pix of pixel) {
        const parts = pix.split("-");
        const start = parseInt(parts[1]) - 1;
        const end = parseInt(parts[2]) + 1;
        for (let i = 0; i < 60; i++) {
          if (i < start || i >= end) {
            if (freerow < 3) continue;
            if (freerow === 3 && i > 19 && i < 41) continue;
            freeCoordinates.push(`${i}-${freerow}`);
          }
        }
        freerow++;
      }
      // Fisher-Yates shuffle with seeded rng
      for (let i = freeCoordinates.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [freeCoordinates[i], freeCoordinates[j]] = [
          freeCoordinates[j],
          freeCoordinates[i],
        ];
      }
    }

    // Place candles
    let fullCandleBg = false;
    if (candleCount > 0) {
      if (candleCount < freeCoordinates.length) {
        for (let i = 0; i < candleCount; i++) {
          const [x, y] = freeCoordinates[i].split("-");
          pixelGrid[parseInt(y) + 1][parseInt(x) + 1] = "candles";
        }
      } else {
        fullCandleBg = true;
      }
    }

    // RIP text positions
    const ripPositions: boolean[][] = Array.from({ length: 61 }, () =>
      Array(61).fill(false),
    );
    for (const r in RIP_TEXT_COORDS) {
      for (const col of RIP_TEXT_COORDS[r]) {
        ripPositions[r as unknown as number][col] = true;
      }
    }

    // Roman numeral positions
    const romanCoords = computeRomanCoords(assetCount);
    const romanPositions: boolean[][] = Array.from({ length: 61 }, () =>
      Array(61).fill(false),
    );
    for (let r = 1; r <= 60; r++) {
      for (let c = 1; c <= 60; c++) {
        if (romanCoords[r]?.includes(c)) {
          romanPositions[r][c + 1] = true;
        }
      }
    }

    // Shape defs
    const bigCellSize = cellSize * 1.5;
    const half = cellSize / 2;
    const candleRadius = cellSize / 2;

    const defs = [
      // Rotated rects for bg/urn
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<rect id="p${i}" width="${bigCellSize}" height="${bigCellSize}" transform="rotate(45 ${half} ${half})" />`,
      ),
      // Rotated rects for sockel
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<rect id="r${i}" width="${bigCellSize}" height="${bigCellSize}" transform="rotate(45 ${half} ${half})" />`,
      ),
      // Single-cell rotated rects for candles
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<rect id="c${i}" width="${cellSize}" height="${cellSize}" transform="rotate(45 ${half} ${half})" />`,
      ),
      // Bigger circles for text
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<circle id="b${i}" cx="${candleRadius * 2}" cy="${candleRadius * 2}" r="${candleRadius * 1.33}" />`,
      ),
    ];

    // Build pixel elements
    const backgroundPixels: string[] = [];
    const urnPixels: string[] = [];
    const candlePixels: string[] = [];
    const ripTextPixels: string[] = [];
    const romanPixels: string[] = [];
    const podestPixels: string[] = [];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = pixelGrid[y + 1][x + 1];
        const shapeId = Math.floor(rng() * 3);
        const px = x * cellSize;
        const py = y * cellSize;

        if (cell === "transparent") {
          const color = fullCandleBg ? getCandleColor() : getBackgroundColor();
          backgroundPixels.push(
            `<use href="#p${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "urn") {
          const color = getUrnColor(x, y);
          urnPixels.push(
            `<use href="#p${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "sockel") {
          const color = getPedestalColor(x, y);
          podestPixels.push(
            `<use href="#r${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "candles") {
          const color = getCandleColor();
          candlePixels.push(
            `<use href="#c${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }

        // RIP text overlay
        if (ripPositions[y + 1][x + 1]) {
          const color = getPedestalColor(x, y, "text");
          ripTextPixels.push(
            `<use href="#b${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }

        // Roman numeral overlay
        if (romanPositions[y + 1][x + 1]) {
          const color = getPedestalColor(x, y, "text");
          romanPixels.push(
            `<use href="#b${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }
      }
    }

    const svgStr = [
      `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`,
      `<defs>${defs.join("")}</defs>`,
      `<rect width="100%" height="100%" fill="${toHsl({ h: backgroundHue, s: 10, l: 96 })}"/>`,
      ...backgroundPixels,
      ...urnPixels,
      ...candlePixels,
      ...ripTextPixels,
      ...romanPixels,
      ...podestPixels,
      `</svg>`,
    ].join("");

    return svgStr;
  }, [assetCount, candleCount, resolvedSeed]);

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
