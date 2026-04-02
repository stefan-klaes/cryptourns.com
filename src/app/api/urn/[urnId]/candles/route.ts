import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/clients/db";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { revalidatePath } from "next/cache";
import {
  buildLightCandleMessage,
  buildUnlightCandleMessage,
} from "@/lib/urn/lightCandleMessage";
import { validateUrnIdParam } from "@/lib/validation/route-params";
import { getAddress, isAddress, isHex, recoverMessageAddress } from "viem";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ urnId: string }> };

type CandleIntent = "light" | "remove";

function parseAddressParam(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return getAddress(raw.trim());
  } catch {
    return null;
  }
}

function parseIntent(body: unknown): CandleIntent {
  if (typeof body !== "object" || body === null) return "light";
  const raw = (body as { intent?: unknown }).intent;
  if (raw === "remove") return "remove";
  return "light";
}

async function recoverSigner(
  message: string,
  signature: string,
): Promise<{ ok: true; address: string } | { ok: false; response: NextResponse }> {
  if (!isHex(signature) || signature.length !== 132) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid signature" }, { status: 400 }),
    };
  }

  let signer: string;
  try {
    signer = await recoverMessageAddress({ message, signature });
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid signature" }, { status: 400 }),
    };
  }

  if (!isAddress(signer)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid signer" }, { status: 400 }),
    };
  }

  return { ok: true, address: getAddress(signer) };
}

/** Bust urn page metadata and all image entrypoints (rewrite targets + canonical API path). */
function revalidateUrnMetadataAndImage(urnId: number) {
  revalidatePath(`/urn/${urnId}`);
  revalidatePath("/urns");
  revalidatePath(`/api/urn/${urnId}/image`);
  revalidatePath(`/api/urn/image/cryptourn-${urnId}.png`);
  revalidatePath(`/api/urn/image/cryptourn-${urnId}.webp`);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const validationResult = await validateUrnIdParam(context.params);
  if (!validationResult.success) {
    return validationResult.response;
  }

  const { urnId } = validationResult.data;
  const viewer = parseAddressParam(request.nextUrl.searchParams.get("address"));

  const urn = await db.urn.findUnique({
    where: { id: urnId },
    select: {
      id: true,
      _count: { select: { candles: true } },
    },
  });

  if (!urn) {
    return NextResponse.json({ error: "Urn not found" }, { status: 404 });
  }

  let litByMe = false;
  if (viewer) {
    const row = await db.candle.findUnique({
      where: { urnId_address: { urnId, address: viewer } },
    });
    litByMe = row != null;
  }

  return NextResponse.json({
    count: urn._count.candles,
    litByMe,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const validationResult = await validateUrnIdParam(context.params);
  if (!validationResult.success) {
    return validationResult.response;
  }

  const { urnId } = validationResult.data;
  const { chainId } = getCryptournsChainConfig();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const intent = parseIntent(body);

  const signature =
    typeof body === "object" &&
    body !== null &&
    "signature" in body &&
    typeof (body as { signature: unknown }).signature === "string"
      ? (body as { signature: string }).signature.trim()
      : "";

  const message =
    intent === "remove"
      ? buildUnlightCandleMessage(urnId, chainId)
      : buildLightCandleMessage(urnId, chainId);

  const recovered = await recoverSigner(message, signature);
  if (!recovered.ok) {
    return recovered.response;
  }

  const { address } = recovered;

  const urn = await db.urn.findUnique({
    where: { id: urnId },
    select: { id: true },
  });
  if (!urn) {
    return NextResponse.json({ error: "Urn not found" }, { status: 404 });
  }

  if (intent === "remove") {
    const removed = await db.candle.deleteMany({
      where: { urnId, address },
    });
    const count = await db.candle.count({ where: { urnId } });
    if (removed.count > 0) {
      revalidateUrnMetadataAndImage(urnId);
    }
    return NextResponse.json({
      count,
      litByMe: false,
      alreadyRemoved: removed.count === 0,
    });
  }

  const existing = await db.candle.findUnique({
    where: { urnId_address: { urnId, address } },
  });

  if (existing) {
    const count = await db.candle.count({ where: { urnId } });
    return NextResponse.json({ count, litByMe: true, alreadyLit: true });
  }

  try {
    await db.candle.create({
      data: { urnId, address },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const count = await db.candle.count({ where: { urnId } });
      revalidateUrnMetadataAndImage(urnId);
      return NextResponse.json({ count, litByMe: true, alreadyLit: true });
    }
    throw e;
  }

  const count = await db.candle.count({ where: { urnId } });
  revalidateUrnMetadataAndImage(urnId);
  return NextResponse.json({ count, litByMe: true, alreadyLit: false });
}
