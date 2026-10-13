import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { canTryLogin, recordLoginFailure } from "./ratelimit";

const COOKIE = "costume-admin";

// The cookie holds a hash of the password, so changing ADMIN_PASSWORD logs everyone out.
function sessionValue(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`costume-swap:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function isAdmin(): Promise<boolean> {
  const expected = sessionValue();
  const actual = (await cookies()).get(COOKIE)?.value;
  return !!expected && !!actual && safeEqual(actual, expected);
}

export async function logIn(
  password: string,
): Promise<"ok" | "wrong" | "too-many"> {
  if (!(await canTryLogin())) return "too-many";
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !safeEqual(password, expected)) {
    await recordLoginFailure();
    return "wrong";
  }
  (await cookies()).set(COOKIE, sessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
  return "ok";
}

export async function logOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
