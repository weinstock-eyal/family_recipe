import { NextRequest, NextResponse } from "next/server";
import { createSession, validateFamilyCode } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  const { familyCode, displayName } = await request.json();

  if (!familyCode || !displayName) {
    return NextResponse.json(
      { error: "יש למלא את כל השדות" },
      { status: 400 }
    );
  }

  if (!validateFamilyCode(familyCode)) {
    return NextResponse.json(
      { error: "קוד משפחתי שגוי" },
      { status: 401 }
    );
  }

  await createSession(displayName.trim());

  return NextResponse.json({ success: true });
}
