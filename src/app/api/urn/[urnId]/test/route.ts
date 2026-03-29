import { getCryptournMintDetails } from "@/lib/clients/indexer/services/getCryptournMintDetails.service";
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
    const mint = await getCryptournMintDetails(urnId);
    return NextResponse.json({
      urnId,
      mint:
        mint == null
          ? null
          : {
              mintTx: mint.mintTx,
              mintedBy: mint.mintedBy,
              mintedAt: mint.mintedAt.toISOString(),
            },
    });
  } catch (err) {
    console.error("getCryptournMintDetails failed:", err);
    return NextResponse.json(
      { error: "Failed to load mint details" },
      { status: 500 },
    );
  }
}
