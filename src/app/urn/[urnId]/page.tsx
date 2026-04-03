import { UrnNftDetail } from "@/components/urn/UrnNftDetail";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { getCryptournOwner } from "@/lib/clients/indexer/services/getCryptournOwner";
import { getEnsPrimaryName } from "@/lib/ens/getEnsPrimaryName";
import { getUrnIndexedAssets } from "@/lib/urn/getUrnIndexedAssets";
import { getUrnMetadata } from "@/lib/urn/getUrnMetadata";
import { updateUrnMetadata } from "@/lib/urn/updateUrnMetadata";
import { notFound } from "next/navigation";
import type { Address } from "viem";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ urnId: string }>;
};

export default async function UrnPage({ params }: PageProps) {
  const { urnId: urnIdParam } = await params;
  const urnId = Number.parseInt(urnIdParam, 10);
  if (!Number.isInteger(urnId) || urnId < 1) {
    notFound();
  }

  await updateUrnMetadata(urnId);
  const [urnData, indexedAssets] = await Promise.all([
    getUrnMetadata(urnId),
    getUrnIndexedAssets(urnId),
  ]);

  if (!urnData) {
    notFound();
  }

  const { metadata, tba: tbaAddress, candleCount } = urnData;

  let ownerAddress: Address | null = null;
  let ownerEnsName: string | null = null;
  try {
    ownerAddress = await getCryptournOwner(urnId);
    ownerEnsName = await getEnsPrimaryName(ownerAddress);
  } catch {
    // RPC or contract read failure — omit owner row
  }

  const { explorerBaseUrl: ownerExplorerBaseUrl, name: chainName } =
    getCryptournsChainConfig();

  return (
    <UrnNftDetail
      urnId={urnId}
      metadata={metadata}
      candleCount={candleCount}
      tbaAddress={tbaAddress}
      chainName={chainName}
      ownerAddress={ownerAddress}
      ownerEnsName={ownerEnsName}
      ownerExplorerBaseUrl={ownerExplorerBaseUrl}
      indexedCoins={indexedAssets.coins}
      indexedNfts={indexedAssets.nfts}
    />
  );
}
