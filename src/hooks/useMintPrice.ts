const MINT_PRICE = BigInt("10000000000000000"); // 0.01 ETH in wei

export function useMintPrice() {
  return {
    /** Price per mint in wei */
    price: MINT_PRICE,
    /** Human-readable price */
    formatted: "0.01",
    isLoading: false,
  } as const;
}
