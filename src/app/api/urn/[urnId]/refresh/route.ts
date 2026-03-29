import { db } from "@/lib/clients/db";
import { updateUrnMetadata } from "@/lib/urn/updateUrnMetadata";
import { validateUrnIdParam } from "@/lib/validation/route-params";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ urnId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const validationResult = await validateUrnIdParam(context.params);
  if (!validationResult.success) {
    return validationResult.response;
  }

  const { urnId } = validationResult.data;

  try {
    await updateUrnMetadata(urnId);
  } catch (err) {
    console.error("updateUrnMetadata failed:", err);
    return NextResponse.json(
      { error: "Failed to refresh urn metadata" },
      { status: 500 },
    );
  }

  const urn = await db.urn.findUnique({
    where: { id: urnId },
    include: { _count: { select: { assets: true } } },
  });

  return NextResponse.json({
    ok: true,
    urnId,
    cracked: urn?.cracked ?? false,
    assetCount: urn?._count.assets ?? 0,
  });
}
