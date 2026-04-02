import { UrnNftDetail } from "@/components/urn/UrnNftDetail";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { ViemProvider } from "@/lib/clients/indexer/ViemProvider";
import { getEnsPrimaryName } from "@/lib/ens/getEnsPrimaryName";
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
  const metadata = await getUrnMetadata(urnId);

  if (!metadata) {
    notFound();
  }

  let ownerAddress: Address | null = null;
  let ownerEnsName: string | null = null;
  try {
    const viem = new ViemProvider();
    ownerAddress = await viem.getOwnerOf(urnId);
    ownerEnsName = await getEnsPrimaryName(ownerAddress);
  } catch {
    // RPC or contract read failure — omit owner row
  }

  const { explorerBaseUrl: ownerExplorerBaseUrl } = getCryptournsChainConfig();

  return (
    <UrnNftDetail
      urnId={urnId}
      metadata={metadata}
      ownerAddress={ownerAddress}
      ownerEnsName={ownerEnsName}
      ownerExplorerBaseUrl={ownerExplorerBaseUrl}
    />
  );
}
