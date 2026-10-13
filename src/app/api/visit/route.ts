import { isAdmin } from "@/lib/auth";
import { canCountVisit } from "@/lib/ratelimit";
import { recordVisit } from "@/lib/visits";

export async function POST(request: Request) {
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) {
    return new Response(null, { status: 400 });
  }
  // Don't count volunteers checking the site.
  try {
    if (!(await isAdmin()) && (await canCountVisit())) await recordVisit(id);
  } catch (e) {
    console.error("Couldn't record visit", e);
  }
  return new Response(null, { status: 204 });
}
