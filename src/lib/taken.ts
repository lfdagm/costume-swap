import { getRedis } from "./redis";

// Costume ids that have been taken, stored as a Redis set.
const KEY = "taken";

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
