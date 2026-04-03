import { getCryptournsSupplyAlchemy } from "../alchemy/supply";
import { withFallback } from "../withFallback";

export const getCryptournsSupply = withFallback(
  "getCryptournsSupply",
  getCryptournsSupplyAlchemy,
);
