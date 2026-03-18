import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "family_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function createSession(user: {
  id: number;
  displayName: string;
  role: string;
  isActive: number;
}) {
  const token = await new SignJWT({
    userId: user.id,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function verifySession(): Promise<{
  userId: number;
  displayName: string;
  role: string;
  isActive: number;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      displayName: payload.displayName as string,
      role: payload.role as string,
      isActive: (payload.isActive as number) ?? 1,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<{
  userId: number;
  displayName: string;
  role: string;
  isActive: number;
}> {
  const session = await verifySession();
  if (!session || session.role !== "admin") {
    throw new Error("אין לך הרשאה לגשת לעמוד זה");
  }
  return session;
}

export async function getDisplayName(): Promise<string> {
  const session = await verifySession();
  if (!session) throw new Error("Not authenticated");
  return session.displayName;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
