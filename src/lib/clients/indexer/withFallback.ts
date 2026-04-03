/**
 * Compose async functions with fallback: tries each in order, returns first success.
 * When only one function is provided, returns it directly (zero overhead).
 */
export function withFallback<TArgs extends unknown[], TResult>(
  label: string,
  ...fns: Array<(...args: TArgs) => Promise<TResult>>
): (...args: TArgs) => Promise<TResult> {
  if (fns.length === 0) throw new Error(`[indexer] ${label}: no providers`);
  if (fns.length === 1) return fns[0]!;
  return async (...args) => {
    let lastError: unknown;
    for (const fn of fns) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;
        console.error(`[indexer] ${label} fallback:`, err);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  };
}
