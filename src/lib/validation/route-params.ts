import { NextResponse } from "next/server";

export type ValidateUrnIdSuccess = { success: true; data: { urnId: number } };
export type ValidateUrnIdFailure = { success: false; response: NextResponse };

export async function validateUrnIdParam(
  params: Promise<{ urnId: string }>,
): Promise<ValidateUrnIdSuccess | ValidateUrnIdFailure> {
  const { urnId: raw } = await params;
  const urnId = Number.parseInt(raw, 10);
  if (!Number.isInteger(urnId) || urnId < 1) {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid urn id" }, { status: 400 }),
    };
  }
  return { success: true, data: { urnId } };
}
