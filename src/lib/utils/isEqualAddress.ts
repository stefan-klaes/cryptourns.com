import type { Address } from "viem";
import { isAddressEqual } from "viem";

/** Case-insensitive comparison (viem); throws if either value is not a valid address. */
export function isEqualAddress(
  a: Address | string,
  b: Address | string,
): boolean {
  return isAddressEqual(a as Address, b as Address);
}
