import { getRedis } from "./redis";

// Private visit counter, shown only on /admin. A "visit" is one browser session
// on the public page; unique visitors are counted with a HyperLogLog of random
// per-browser ids (no personal data stored).
const TOTAL = "visits:total";
const DAILY = "visits:daily"; // hash: YYYY-MM-DD -> count
const VISITORS = "visits:visitors";

// Days are counted in the school's time zone.
function day(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
  }).format(date);
}

export async function recordVisit(visitorId: string): Promise<void> {
  const db = getRedis();
  if (!db) return;
  await db
    .pipeline()
    .incr(TOTAL)
    .hincrby(DAILY, day(), 1)
    .pfadd(VISITORS, visitorId)
    .exec();
}

export type VisitStats = {
  total: number;
  unique: number;
  lastDays: { day: string; visits: number }[]; // most recent first
};

export async function getVisitStats(days = 7): Promise<VisitStats> {
  const db = getRedis();
  if (!db) return { total: 0, unique: 0, lastDays: [] };
  const keys = Array.from({ length: days }, (_, i) =>
    day(new Date(Date.now() - i * 24 * 60 * 60 * 1000)),
  );
  const [total, unique, counts] = await Promise.all([
    db.get<number>(TOTAL),
    db.pfcount(VISITORS),
    db.hmget<Record<string, number>>(DAILY, ...keys),
  ]);
  return {
    total: total ?? 0,
    unique,
    lastDays: keys.map((k) => ({ day: k, visits: Number(counts?.[k] ?? 0) })),
  };
}
