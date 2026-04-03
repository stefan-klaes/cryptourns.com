import { getOwnedCryptournsAlchemy } from "../alchemy/portfolio";
import { withFallback } from "../withFallback";

export const getOwnedCryptournsForWallet = withFallback(
  "getOwnedCryptournsForWallet",
  getOwnedCryptournsAlchemy,
);
