import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "יש למלא את כל השדות" },
      { status: 400 }
    );
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return NextResponse.json(
      { error: "אימייל או סיסמה שגויים" },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "החשבון שלך הושבת. פנה למנהל המערכת." },
      { status: 403 }
    );
  }

  await createSession({
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
  });

  return NextResponse.json({ success: true });
}
