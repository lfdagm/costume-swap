import { Redis } from "@upstash/redis";

// Costume ids (photo file names) that have been taken, stored as a Redis set.
const KEY = "taken";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) return null;
  redis ??= new Redis({
    url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
    token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
  });
  return redis;
}

export async function getTaken(): Promise<string[]> {
  const db = getRedis();
  if (!db) return [];
  return db.smembers(KEY);
}

export async function setTaken(id: string, taken: boolean): Promise<void> {
  const db = getRedis();
  if (!db) throw new Error("Database is not configured");
  if (taken) await db.sadd(KEY, id);
  else await db.srem(KEY, id);
}
