export function shortenAddress(value: string | undefined): string {
  if (!value) return "";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
