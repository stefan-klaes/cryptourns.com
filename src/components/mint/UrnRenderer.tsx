"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { urnPixelArray, RIP_TEXT_COORDS } from "@/lib/urn/urnShape";
import { computeRomanCoords } from "@/lib/urn/romanNumerals";

const URN_BODY_PALETTES = [
  ["#e8725a", "#d4594a", "#f0956e", "#c4453e", "#d97b6a"],
  ["#1b3a5c", "#2a6478", "#3d8e9e", "#1f4f6e", "#4ba3a8"],
  ["#2d5a3d", "#4a7a56", "#3b6b48", "#6b8f5e", "#587a4e"],
  ["#3c2d6b", "#5b4a8a", "#7a5fa0", "#4e3d7a", "#6b5592"],
  ["#7a2e2e", "#9c4040", "#b05a3a", "#8b3535", "#a04a42"],
  ["#3d4a5c", "#546478", "#4a5a6e", "#6b7a8e", "#5c6c80"],
  ["#c48820", "#d4a035", "#b07818", "#a86828", "#cc942a"],
  ["#6aa0b8", "#80b4c8", "#5890a8", "#92c4d4", "#7aaac0"],
  ["#1a1a2e", "#2d2d44", "#3a3a52", "#242438", "#32324a"],
  ["#a8566a", "#c47088", "#8e4a5c", "#b86078", "#9a5268"],
];

const BG_COLORS = ["#ffffff", "#f5f5f5", "#f8f8f8", "#f1f1f1", "#f3f3f3"];
const SOCKEL_COLORS = ["#111010", "#171717", "#191818", "#211f1f", "#161515"];
const CANDLE_COLORS = ["#ffff00", "#d8d80a", "#d2d21a", "#bdbd0d", "#f3f332"];

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
}

export function UrnRenderer({
  assetCount,
  candleCount,
  className,
}: UrnRendererProps) {
  const seedRef = useRef(Date.now());

  const svgContent = useMemo(() => {
    const rng = mulberry32(seedRef.current);
    const size = 600;
    const cellSize = size / 60;
    const gridSize = 60;
    const pixel = urnPixelArray();

    // Pick base palette for urn body and a different accent palette for stripe
    const baseIdx = Math.floor(rng() * URN_BODY_PALETTES.length);
    let accentIdx = Math.floor(rng() * (URN_BODY_PALETTES.length - 1));
    if (accentIdx >= baseIdx) accentIdx++;
    const basePalette = URN_BODY_PALETTES[baseIdx];
    const accentPalette = URN_BODY_PALETTES[accentIdx];

    // Stripe band: a horizontal stripe across ~8 rows in the middle of the urn
    const stripeStart = 20;
    const stripeEnd = 27;

    // Build pixel grid
    type CellType = "transparent" | "urn" | "stripe" | "sockel" | "candles";
    const pixelGrid: CellType[][] = Array.from({ length: 61 }, () =>
      Array<CellType>(61).fill("transparent"),
    );

    let row = 0;
    for (const p of pixel) {
      row++;
      const parts = p.split("-");
      const start = parseInt(parts[1]);
      const end = parseInt(parts[2]);
      for (let k = start - 1; k <= end; k++) {
        if (parts[0] === "urn") {
          pixelGrid[row][k + 1] =
            row >= stripeStart && row <= stripeEnd ? "stripe" : "urn";
        } else if (parts[0] === "sockel") {
          pixelGrid[row][k + 1] = "sockel";
        }
      }
    }

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

    const bgColors = fullCandleBg ? CANDLE_COLORS : BG_COLORS;

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
      // Non-rotated rects for sockel
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<rect id="r${i}" width="${cellSize}" height="${cellSize}" />`,
      ),
      // Circles for candles
      ...Array.from(
        { length: 3 },
        (_, i) =>
          `<circle id="c${i}" cx="${candleRadius}" cy="${candleRadius}" r="${candleRadius}" />`,
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
          const color = bgColors[Math.floor(rng() * bgColors.length)];
          backgroundPixels.push(
            `<use href="#p${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "urn") {
          const color =
            basePalette[Math.floor(rng() * basePalette.length)];
          urnPixels.push(
            `<use href="#p${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "stripe") {
          const color =
            accentPalette[Math.floor(rng() * accentPalette.length)];
          urnPixels.push(
            `<use href="#p${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "sockel") {
          const color =
            SOCKEL_COLORS[Math.floor(rng() * SOCKEL_COLORS.length)];
          podestPixels.push(
            `<use href="#r${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        } else if (cell === "candles") {
          const color =
            CANDLE_COLORS[Math.floor(rng() * CANDLE_COLORS.length)];
          candlePixels.push(
            `<use href="#c${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }

        // RIP text overlay
        if (ripPositions[y + 1][x + 1]) {
          const color =
            SOCKEL_COLORS[Math.floor(rng() * SOCKEL_COLORS.length)];
          ripTextPixels.push(
            `<use href="#b${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }

        // Roman numeral overlay
        if (romanPositions[y + 1][x + 1]) {
          const color =
            SOCKEL_COLORS[Math.floor(rng() * SOCKEL_COLORS.length)];
          romanPixels.push(
            `<use href="#b${shapeId}" x="${px}" y="${py}" fill="${color}"/>`,
          );
        }
      }
    }

    const svgStr = [
      `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`,
      `<defs>${defs.join("")}</defs>`,
      `<rect width="100%" height="100%" fill="#f0f0f0"/>`,
      ...backgroundPixels,
      ...urnPixels,
      ...candlePixels,
      ...ripTextPixels,
      ...romanPixels,
      ...podestPixels,
      `</svg>`,
    ].join("");

    return svgStr;
  }, [assetCount, candleCount]);

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
