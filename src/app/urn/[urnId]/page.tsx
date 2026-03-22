import { UrnNftDetail } from "@/components/urn/UrnNftDetail";
import { getUrnMetadata } from "@/lib/urn/getUrnMetadata";
import { updateUrnMetadata } from "@/lib/urn/updateUrnMetadata";
import { notFound } from "next/navigation";

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

  return <UrnNftDetail urnId={urnId} metadata={metadata} />;
}
