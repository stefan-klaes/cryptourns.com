import { getWalletPortfolioAlchemy } from "../alchemy/portfolio";
import { withFallback } from "../withFallback";

export const getWalletPortfolio = withFallback(
  "getWalletPortfolio",
  getWalletPortfolioAlchemy,
);
