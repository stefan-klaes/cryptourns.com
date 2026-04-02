import { resolveEnsName } from "@/lib/ens/resolveEnsName";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name =
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";

  try {
    const result = await resolveEnsName(name);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      address: result.address,
      normalizedName: result.normalizedName,
    });
  } catch (err) {
    console.error("resolveEnsName failed:", err);
    return NextResponse.json(
      { error: "ENS lookup failed" },
      { status: 500 },
    );
  }
}
