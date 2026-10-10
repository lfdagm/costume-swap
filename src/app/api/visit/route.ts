import { isAdmin } from "@/lib/auth";
import { recordVisit } from "@/lib/visits";

export async function POST(request: Request) {
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) {
    return new Response(null, { status: 400 });
  }
  // Don't count volunteers checking the site.
  if (!(await isAdmin())) await recordVisit(id);
  return new Response(null, { status: 204 });
}
