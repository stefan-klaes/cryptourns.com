import type { Route } from "next";

export function collectionHref(contractAddress: string): Route {
  return `/collections/${contractAddress.toLowerCase()}` as Route;
}
