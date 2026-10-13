import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";
import { getRedis } from "./redis";

type Limiter = Pick<Ratelimit, "limit" | "getRemaining">;

function limiter(
  prefix: string,
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
): Limiter | null {
  const redis = getRedis();
  return redis ? new Ratelimit({ redis, limiter, prefix }) : null;
}

// Login: 5 tries per 15 minutes from one connection, and at most 30 wrong
// passwords per hour in total, so guessing the password isn't practical.
const loginPerIp = limiter("rl:login:ip", Ratelimit.slidingWindow(5, "15 m"));
const loginFailures = limiter(
  "rl:login:fail",
  Ratelimit.slidingWindow(30, "1 h"),
);
// Visit counter: stops a script from inflating the numbers.
const visitPerIp = limiter("rl:visit:ip", Ratelimit.slidingWindow(20, "1 m"));

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function canTryLogin(): Promise<boolean> {
  if (!loginPerIp || !loginFailures) return true;
  const [ip, failures] = await Promise.all([
    loginPerIp.limit(await clientIp()),
    loginFailures.getRemaining("all"),
  ]);
  return ip.success && failures.remaining > 0;
}

export async function recordLoginFailure(): Promise<void> {
  await loginFailures?.limit("all");
}

export async function canCountVisit(): Promise<boolean> {
  if (!visitPerIp) return true;
  return (await visitPerIp.limit(await clientIp())).success;
}
