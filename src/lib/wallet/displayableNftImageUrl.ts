/** Normalize IPFS and http(s) URLs for `<img>` / `next/image`. */
export function displayableNftImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    const rest = url.slice("ipfs://".length);
    const path = rest.startsWith("ipfs/") ? rest.slice("ipfs/".length) : rest;
    return `https://ipfs.io/ipfs/${path}`;
  }
  return url;
}
