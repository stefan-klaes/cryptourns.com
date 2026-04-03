import { resolveEnsName } from "@/lib/ens/resolveEnsName";
import { NextResponse } from "next/server";

type Body = { name?: unknown };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body.name === "string" ? body.name : "";
  try {
    const result = await resolveEnsName(raw);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      address: result.address,
      normalizedName: result.normalizedName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ENS resolution failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
