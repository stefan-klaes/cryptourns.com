/** True when the user dismissed or rejected a wallet signature / transaction request. */
export function isWalletUserRejection(error: unknown): boolean {
  if (error && typeof error === "object") {
    const name = (error as { name?: string }).name;
    if (name === "UserRejectedRequestError") return true;
    const code = (error as { code?: number }).code;
    if (code === 4001) return true;
    const cause = (error as { cause?: unknown }).cause;
    if (cause) return isWalletUserRejection(cause);
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /user rejected|denied|rejected the request|user denied|rejected transaction/i.test(
    msg,
  );
}
