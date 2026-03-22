import { computeRomanCoords } from "@/lib/urn/romanNumerals";
import { RIP_TEXT_COORDS, urnPixelArray } from "@/lib/urn/urnShape";

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

/** Subtle per-cell noise for empty urn greys (keeps mosaic texture without big swings). */
function emptyMosaicNoise(
  paletteSeed: number,
  layer: "urn" | "sockel",
  x: number,
  y: number,
) {
  const n = hashStringToSeed(`${layer}:${paletteSeed}:${x}:${y}`);
  const a = (n & 1023) / 1023;
  const b = ((n >>> 10) & 1023) / 1023;
  const c = ((n >>> 20) & 1023) / 1023;
  return {
    h: (a - 0.5) * 2.5,
    s: (b - 0.5) * 3,
    l: (c - 0.5) * 1.8,
  };
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

/** 2D-mix seed so each grid cell gets its own uncorrelated PRNG (avoids axis banding). */
function mixSeedXY(seed: number, x: number, y: number) {
  let h =
    (seed ^ Math.imul(x + 1, 0x1b873593) ^ Math.imul(y + 1, 0xe6546b64)) >>>
    0;
  h = Math.imul(h ^ (h >>> 16), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

const EMPTY_PALETTE = {
  urnHue: 220,
  urnSat: 11,
  pedestalHue: 218,
  pedestalSat: 10,
} as const;

export type GenerateUrnSvgParams = {
  assetCount: number;
  candleCount: number;
  seed: string | number;
};

export function generateUrnSvgString({
  assetCount,
  candleCount,
  seed,
}: GenerateUrnSvgParams): string {
    type CellType = "transparent" | "urn" | "sockel" | "candles";

    const isEmptyUrn = assetCount === 0 && candleCount === 0;
    const paletteSeed = hashStringToSeed(String(seed));
    const rng = isEmptyUrn ? null : mulberry32(paletteSeed);
    const shapeRng = !isEmptyUrn ? rng! : null;

    let emptyBgBaseHue = 220;
    let emptyBgBaseSat = 10;
    if (isEmptyUrn) {
      const h = hashStringToSeed(`empty-bg:${String(seed)}`);
      emptyBgBaseHue = (h % 24) + 210;
      emptyBgBaseSat = 7 + ((h >>> 8) % 4);
    }

    const size = 600;
    const cellSize = size / 60;
    const gridSize = 60;
    const emptyBodyGradientT = isEmptyUrn
      ? (() => {
          const gh = hashStringToSeed(`empty-grad:${String(seed)}`);
          const angle = (gh / 4294967296) * Math.PI * 2;
          const gx = Math.cos(angle);
          const gy = Math.sin(angle);
          const p0 = 0;
          const p1 = gx;
          const p2 = gy;
          const p3 = gx + gy;
          const gmin = Math.min(p0, p1, p2, p3);
          const gmax = Math.max(p0, p1, p2, p3);
          const denom = gmax - gmin || 1;
          return (x: number, y: number) => {
            const nx = x / (gridSize - 1);
            const ny = y / (gridSize - 1);
            return (nx * gx + ny * gy - gmin) / denom;
          };
        })()
      : (_x: number, _y: number) => 0;
    const pixel = urnPixelArray();

    let gradientVector = { x: 0, y: 1 };
    let minProjection = 0;
    let maxProjection = 1;
    let urnHue = 0;
    let urnSaturation = 0;
    let lightStart = 0;
    let lightEnd = 0;
    let hueDrift = 0;
    let saturationDrift = 0;
    let backgroundHue = 0;
    let backgroundSaturation = 0;
    let pedestalHue = 0;
    let pedestalSaturation = 0;
    let pedestalLightness = 0;
    let candleHue = 0;
    let isDarkUrnVariant = false;

    if (rng) {
      const urnFamily =
        URN_COLOR_FAMILIES[Math.floor(rng() * URN_COLOR_FAMILIES.length)];
      urnHue = randomBetween(rng, urnFamily.hueMin, urnFamily.hueMax);
      urnSaturation = randomBetween(rng, urnFamily.satMin, urnFamily.satMax);
      const gradientMode = ["vertical", "horizontal", "angled"][
        Math.floor(rng() * 3)
      ] as "vertical" | "horizontal" | "angled";
      const gradientAngle =
        gradientMode === "vertical"
          ? Math.PI / 2
          : gradientMode === "horizontal"
            ? 0
            : randomBetween(rng, 0, Math.PI * 2);
      gradientVector = {
        x: Math.cos(gradientAngle),
        y: Math.sin(gradientAngle),
      };
      const projectionRange = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ].map(({ x, y }) => x * gradientVector.x + y * gradientVector.y);
      minProjection = Math.min(...projectionRange);
      maxProjection = Math.max(...projectionRange);
      lightStart = randomBetween(rng, 56, 68);
      lightEnd = lightStart - randomBetween(rng, 18, 30);
      hueDrift = randomBetween(rng, -12, 12);
      saturationDrift = randomBetween(rng, -10, 10);
      backgroundHue = (urnHue + randomBetween(rng, -18, 18) + 360) % 360;
      backgroundSaturation = randomBetween(rng, 6, 16);
      pedestalHue = (urnHue + randomBetween(rng, -8, 8) + 360) % 360;
      pedestalSaturation = clamp(
        urnSaturation * randomBetween(rng, 0.35, 0.55),
        12,
        34,
      );
      pedestalLightness = randomBetween(rng, 16, 24);
      candleHue = randomBetween(rng, 42, 58);
      isDarkUrnVariant = rng() < 0.5;
    }

    const getGradientT = (x: number, y: number) => {
      const nx = x / (gridSize - 1);
      const ny = y / (gridSize - 1);
      const projection = nx * gradientVector.x + ny * gradientVector.y;
      return (projection - minProjection) / (maxProjection - minProjection);
    };

    const getEmptyUrnBodyColor = (
      x: number,
      y: number,
      mode: "body" | "rip" = "body",
    ) => {
      const tGrad = emptyBodyGradientT(x, y);
      const tw = hashStringToSeed(`emptw:${paletteSeed}:${x}:${y}`);
      const tWarp = (tw & 1023) / 1023;
      const t = clamp(tGrad * 0.8 + tWarp * 0.2, 0, 1);
      const isTopUrnRow = y === 3;
      const noise = emptyMosaicNoise(paletteSeed, "urn", x, y);
      let l =
        56 - t * 11 + (isTopUrnRow ? -10 : 0) + noise.l + (1 - t) * 0.45;
      let s = clamp(EMPTY_PALETTE.urnSat + (1 - t) * 1.2 + noise.s, 7, 16);
      const h = (EMPTY_PALETTE.urnHue + noise.h + 360) % 360;
      if (mode === "rip") {
        l = clamp(l - 18, 18, 36);
        s = clamp(s + 1.5, 8, 18);
      } else {
        l = clamp(l, 44, 58);
      }
      return toHsl({ h, s, l });
    };

    const getUrnColor = (x: number, y: number) => {
      if (isEmptyUrn) return getEmptyUrnBodyColor(x, y);
      const t = getGradientT(x, y);
      const isTopUrnRow = y === 3;
      const lightnessBase =
        lightStart +
        (lightEnd - lightStart) * t +
        randomBetween(rng!, -2.5, 2.5);
      const saturationBase =
        urnSaturation +
        saturationDrift * (t - 0.5) +
        randomBetween(rng!, -4, 4);
      const hueBase =
        urnHue + hueDrift * (t - 0.5) + randomBetween(rng!, -3, 3);
      const variantLightness = isDarkUrnVariant
        ? clamp(13 - t * 7 + randomBetween(rng!, -1.5, 1.5), 3, 18)
        : lightnessBase + randomBetween(rng!, -1.5, 1.5);
      const variantSaturation = isDarkUrnVariant
        ? clamp(saturationBase * 0.68 + randomBetween(rng!, -3, 3), 12, 52)
        : clamp(saturationBase, 18, 90);

      return toHsl({
        h: (hueBase + 360) % 360,
        s: variantSaturation,
        l: clamp(
          variantLightness +
            (isTopUrnRow ? (isDarkUrnVariant ? -6 : -16) : 0),
          isDarkUrnVariant ? 2 : 14,
          isDarkUrnVariant ? 20 : 78,
        ),
      });
    };

    const getBackgroundColor = (x: number, y: number) => {
      if (isEmptyUrn) {
        const bgCellRng = mulberry32(mixSeedXY(paletteSeed, x, y));
        return toHsl({
          h: (emptyBgBaseHue + randomBetween(bgCellRng, -1.5, 1.5) + 360) % 360,
          s: clamp(
            emptyBgBaseSat + randomBetween(bgCellRng, -1.2, 1.2),
            5,
            14,
          ),
          l: clamp(randomBetween(bgCellRng, 93.5, 97.2), 92.5, 98),
        });
      }
      return toHsl({
        h: (backgroundHue + randomBetween(rng!, -4, 4) + 360) % 360,
        s: clamp(backgroundSaturation + randomBetween(rng!, -3, 3), 0, 24),
        l: clamp(randomBetween(rng!, 94, 99), 90, 100),
      });
    };

    const getCandleColor = () =>
      toHsl({
        h: (candleHue + randomBetween(rng!, -7, 7) + 360) % 360,
        s: clamp(randomBetween(rng!, 76, 98), 0, 100),
        l: clamp(randomBetween(rng!, 44, 64), 0, 100),
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

      if (isEmptyUrn) {
        const noise = emptyMosaicNoise(paletteSeed, "sockel", x, y);
        const baseL =
          24 -
          ny * 8 +
          centerLift * 3 +
          topLift * 2 -
          edgeShade * 0.4 +
          noise.l;
        const s =
          EMPTY_PALETTE.pedestalSat + centerLift * 1.8 - ny * 1.4 + noise.s;
        if (variant === "text") {
          return getEmptyUrnBodyColor(x, 3, "rip");
        }
        return toHsl({
          h: (EMPTY_PALETTE.pedestalHue + noise.h * 0.35 + 360) % 360,
          s: clamp(s, 7, 16),
          l: clamp(baseL, 12, 26),
        });
      }

      const baseLightness =
        pedestalLightness + centerLift * 6 + topLift * 5 - edgeShade;
      const variantBaseLightness = isDarkUrnVariant
        ? 10 + centerLift * 3 + topLift * 2 - ny * 2
        : baseLightness;

      return toHsl({
        h: (pedestalHue + randomBetween(rng!, -3, 3) + 360) % 360,
        s: clamp(
          (isDarkUrnVariant
            ? urnSaturation * 0.72 + centerLift * 3 - ny * 2
            : pedestalSaturation + centerLift * 4 - ny * 4) +
            randomBetween(rng!, -2, 2),
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
            randomBetween(rng!, -1.5, 1.5),
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
        const j = Math.floor(rng!() * (i + 1));
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

    const ripPositions: boolean[][] = Array.from({ length: 61 }, () =>
      Array(61).fill(false),
    );
    for (const r in RIP_TEXT_COORDS) {
      const row = Number(r);
      for (const col of RIP_TEXT_COORDS[row]) {
        ripPositions[row][col] = true;
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
        const shapeId = isEmptyUrn
          ? hashStringToSeed(`shape:${paletteSeed}:${x}:${y}`) % 3
          : Math.floor(shapeRng!() * 3);
        const px = x * cellSize;
        const py = y * cellSize;

        if (cell === "transparent") {
          const color = fullCandleBg ? getCandleColor() : getBackgroundColor(x, y);
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
      `<rect width="100%" height="100%" fill="${isEmptyUrn ? toHsl({ h: emptyBgBaseHue, s: clamp(emptyBgBaseSat * 0.92, 6, 11), l: 94.5 }) : toHsl({ h: backgroundHue, s: 10, l: 96 })}" />`,
      ...backgroundPixels,
      ...urnPixels,
      ...candlePixels,
      ...ripTextPixels,
      ...romanPixels,
      ...podestPixels,
      `</svg>`,
    ].join("");

    return svgStr;
}
