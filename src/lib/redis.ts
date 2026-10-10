import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

// Returns null when the database isn't configured (e.g. a fresh local checkout).
export function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis ??= new Redis({ url, token });
  return redis;
}
