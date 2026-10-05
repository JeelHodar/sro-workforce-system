import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "sro_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "sro-development-secret";
const SHELF_LIFE_MS = 1000 * 60 * 60 * 12;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

function encodeSessionToken(userId: string) {
  const payload = JSON.stringify({
    userId,
    expiresAt: Date.now() + SHELF_LIFE_MS,
  });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("hex");

  return `${encodedPayload}.${signature}`;
}

function validateSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("hex");

  const actual = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { userId: string; expiresAt: number };

    if (!payload.userId || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) {
    return null;
  }

  const userId = validateSessionToken(cookie);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}
