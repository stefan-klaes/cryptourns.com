import { UrnInboundTransfersView } from "@/components/urn/UrnInboundTransfersView";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { getUrnAssetTransfers } from "@/lib/urn/getUrnAssetTransfers";
import { getUrnMetadata } from "@/lib/urn/getUrnMetadata";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ urnId: string }>;
};

export default async function UrnTransfersPage({ params }: PageProps) {
  const { urnId: urnIdParam } = await params;
  const urnId = Number.parseInt(urnIdParam, 10);
  if (!Number.isInteger(urnId) || urnId < 1) {
    notFound();
  }

  const urnData = await getUrnMetadata(urnId);
  if (!urnData) {
    notFound();
  }

  const { explorerBaseUrl } = getCryptournsChainConfig();
  const transfers = await getUrnAssetTransfers(urnId);

  return (
    <UrnInboundTransfersView
      urnId={urnId}
      urnDisplayName={urnData.metadata.name}
      transfers={transfers}
      explorerBaseUrl={explorerBaseUrl}
    />
  );
}
