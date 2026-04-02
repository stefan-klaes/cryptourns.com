import { fetchWalletPortfolio } from "@/lib/wallet/fetchWalletPortfolioAction";
import type { WalletPortfolioResponse } from "@/lib/wallet/portfolioTypes";

export async function loadWalletPortfolioClient(
  address: string,
): Promise<WalletPortfolioResponse> {
  const result = await fetchWalletPortfolio(address);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}
