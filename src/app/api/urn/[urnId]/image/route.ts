import { db } from "@/lib/clients/db";
import { generateUrnSvgString } from "@/lib/urn/generateUrnSvgString";
import { validateUrnIdParam } from "@/lib/validation/route-params";
import { AssetType } from "@/generated/prisma";
import sharp from "sharp";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ urnId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const validationResult = await validateUrnIdParam(context.params);
  if (!validationResult.success) {
    return validationResult.response;
  }

  const { urnId } = validationResult.data;

  const urn = await db.urn.findUnique({
    where: { id: urnId },
    include: {
      assets: true,
      _count: { select: { candles: true } },
    },
  });

  if (!urn) {
    return NextResponse.json({ error: "Urn not found" }, { status: 404 });
  }

  const forceEmpty =
    request.nextUrl.searchParams.get("variant") === "empty";

  let nftUnits = 0;
  if (!forceEmpty) {
    for (const a of urn.assets) {
      if (a.type !== AssetType.ERC20) nftUnits += a.quantity;
    }
  }

  const svgString = generateUrnSvgString({
    assetCount: forceEmpty ? 0 : nftUnits,
    candleCount: forceEmpty ? 0 : urn._count.candles,
    seed: `cryptourn-${urnId}`,
  });

  try {
    const webpBuffer = await sharp(Buffer.from(svgString))
      .webp({ quality: 100 })
      .resize(1200, 1200)
      .toBuffer();

    const cacheControl = request.headers.get("x-revalidate") === "true"
      ? "no-store"
      : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

    return new Response(new Uint8Array(webpBuffer), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Error converting SVG to WebP:", error);
    return new Response("Error converting image", { status: 500 });
  }
}
