import { db } from "@/lib/clients/db";
import { getCryptournsSupply } from "@/lib/clients/indexer/services/getCryptournsSupply";
import { updateUrnMetadata } from "@/lib/urn/updateUrnMetadata";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  let totalSupply: number;
  try {
    totalSupply = await getCryptournsSupply();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to read total supply",
      },
      { status: 502 },
    );
  }

  const rows = await db.urn.findMany({ select: { id: true } });
  const dbIds = new Set(rows.map((r) => r.id));
  const missing: number[] = [];
  for (let id = 1; id <= totalSupply; id++) {
    if (!dbIds.has(id)) missing.push(id);
  }

  if (missing.length === 0) {
    return NextResponse.json({
      ok: true,
      synced: 0,
      attempted: 0,
      ids: [] as number[],
      failures: [] as { urnId: number; message: string }[],
    });
  }

  const failures: { urnId: number; message: string }[] = [];
  for (const urnId of missing) {
    try {
      await updateUrnMetadata(urnId);
    } catch (e) {
      failures.push({
        urnId,
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    synced: missing.length - failures.length,
    attempted: missing.length,
    ids: missing,
    failures,
  });
}
