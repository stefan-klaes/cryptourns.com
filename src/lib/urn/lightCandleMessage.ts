/**
 * EIP-191 personal_sign payloads. Must stay in sync between client (sign) and server (verify).
 */
export function buildLightCandleMessage(urnId: number, chainId: number): string {
  return [
    "Cryptourns: light a candle for this urn (gasless, off-chain).",
    `urnId:${urnId}`,
    `chainId:${chainId}`,
  ].join("\n");
}

export function buildUnlightCandleMessage(urnId: number, chainId: number): string {
  return [
    "Cryptourns: remove my candle for this urn (gasless, off-chain).",
    `urnId:${urnId}`,
    `chainId:${chainId}`,
  ].join("\n");
}
