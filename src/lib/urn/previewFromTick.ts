import { MAX_POSSIBLE_ASSETS } from "@/lib/urn/romanNumerals";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic random preview from an integer tick (e.g. counter or interval). */
export function previewFromTick(tick: number, seedPrefix = "preview") {
  const rng = mulberry32(tick + 1);

  return {
    assetCount: Math.floor(rng() * MAX_POSSIBLE_ASSETS) + 1,
    candleCount: Math.floor(rng() * 18),
    rendererSeed: `${seedPrefix}-${tick}`,
  };
}
