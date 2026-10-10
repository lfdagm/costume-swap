import { del, put } from "@vercel/blob";
import { entrances } from "@/config";
import { type Costume, getCostumes } from "./costumes";
import { getRedis } from "./redis";
import { setTaken } from "./taken";

// Costumes added from /admin: the photo goes to Vercel Blob and the details to a
// Redis hash keyed by costume id.
const KEY = "uploads";

type Upload = Costume & { createdAt: number };

async function getUploads(): Promise<Upload[]> {
  const db = getRedis();
  if (!db) return [];
  const all = await db.hgetall<Record<string, Upload>>(KEY);
  return Object.values(all ?? {}).toSorted((a, b) => a.createdAt - b.createdAt);
}

// Photo-folder costumes plus uploaded ones, grouped in entrance order.
export async function getAllCostumes(): Promise<Costume[]> {
  const order = (c: Costume) =>
    entrances.findIndex((e) => e.id === c.entranceId);
  return [...getCostumes(), ...(await getUploads())].toSorted(
    (a, b) => order(a) - order(b),
  );
}

export async function addCostume(
  name: string,
  entranceId: string,
  photo: Blob,
): Promise<void> {
  const db = getRedis();
  if (!db) throw new Error("Database is not configured");
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const id = `upload-${Date.now()}-${slug || "costume"}.jpg`;
  const blob = await put(`costumes/${id}`, photo, {
    access: "public",
    contentType: "image/jpeg",
  });
  const upload: Upload = {
    id,
    name,
    entranceId,
    src: blob.url,
    uploaded: true,
    createdAt: Date.now(),
  };
  await db.hset(KEY, { [id]: upload });
}

export async function deleteCostume(id: string): Promise<void> {
  const db = getRedis();
  if (!db) throw new Error("Database is not configured");
  const upload = await db.hget<Upload>(KEY, id);
  if (!upload) return;
  await db.hdel(KEY, id);
  await setTaken(id, false);
  await del(upload.src);
}
