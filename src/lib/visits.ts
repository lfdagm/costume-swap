import { getRedis } from "./redis";

// Private visit counter, shown only on /admin. A "visit" is one browser session
// on the public page; unique visitors are counted with a HyperLogLog of random
// per-browser ids (no personal data stored).
const TOTAL = "visits:total";
const DAILY = "visits:daily"; // hash: YYYY-MM-DD -> count
const VISITORS = "visits:visitors"; // all-time unique visitors
// Unique visitors per day: one HyperLogLog per day, recorded from Oct 14, 2026.
const dailyVisitors = (day: string) => `visits:visitors:${day}`;

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
    .pfadd(dailyVisitors(day()), visitorId)
    .exec();
}

export type VisitStats = {
  total: number;
  unique: number;
  // Most recent first. `unique` is null for days before per-day tracking began.
  lastDays: { day: string; visits: number; unique: number | null }[];
};

export async function getVisitStats(days = 7): Promise<VisitStats> {
  const db = getRedis();
  if (!db) return { total: 0, unique: 0, lastDays: [] };
  const keys = Array.from({ length: days }, (_, i) =>
    day(new Date(Date.now() - i * 24 * 60 * 60 * 1000)),
  );
  const daily = db.pipeline();
  for (const k of keys)
    daily.exists(dailyVisitors(k)).pfcount(dailyVisitors(k));
  const [total, unique, counts, dailyResults] = await Promise.all([
    db.get<number>(TOTAL),
    db.pfcount(VISITORS),
    db.hmget<Record<string, number>>(DAILY, ...keys),
    daily.exec<number[]>(),
  ]);
  return {
    total: total ?? 0,
    unique,
    lastDays: keys.map((k, i) => ({
      day: k,
      visits: Number(counts?.[k] ?? 0),
      unique: dailyResults[i * 2]
        ? dailyResults[i * 2 + 1]
        : Number(counts?.[k] ?? 0) === 0
          ? 0
          : null,
    })),
  };
}
