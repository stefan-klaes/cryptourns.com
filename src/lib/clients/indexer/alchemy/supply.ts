import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { getConfig } from "./client";

export async function getCryptournsSupplyAlchemy(): Promise<number> {
  const { key, host } = getConfig();

  const url = new URL(`https://${host}/nft/v3/${key}/getContractMetadata`);
  url.searchParams.set("contractAddress", CRYPTOURNS_CONTRACT.address);

  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Alchemy getContractMetadata failed (${res.status}): ${text.slice(0, 500)}`,
    );
  }

  const data = (await res.json()) as { totalSupply: string | undefined };

  if (!data.totalSupply) {
    throw new Error("Total supply not found");
  }

  return Number(data.totalSupply);
}
