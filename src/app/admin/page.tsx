import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import { getTaken } from "@/lib/taken";
import { getAllCostumes } from "@/lib/uploads";
import { getVisitStats, type VisitStats } from "@/lib/visits";
import { logOutAction } from "./actions";
import { AddCostumeForm } from "./add-costume-form";
import { AdminList } from "./admin-list";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Volunteers · Costume Swap",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <Suspense>
      <Admin />
    </Suspense>
  );
}

async function Admin() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold">Volunteers</h1>
        <p className="mt-1 text-stone-600">
          Enter the password to mark costumes as taken.
        </p>
        <LoginForm />
      </main>
    );
  }

  const [costumes, taken, visits] = await Promise.all([
    getAllCostumes(),
    getTaken(),
    getVisitStats(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      <header className="flex items-center justify-between gap-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Manage costumes</h1>
          <p className="text-sm text-stone-600">
            Changes show on the public site right away.
          </p>
        </div>
        <form action={logOutAction}>
          <button className="text-sm font-semibold text-stone-500 underline hover:text-stone-800">
            Log out
          </button>
        </form>
      </header>
      <AddCostumeForm />
      <AdminList costumes={costumes} taken={taken} />
      <VisitStatsCard stats={visits} />
    </main>
  );
}

function VisitStatsCard({ stats }: { stats: VisitStats }) {
  const weekday = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });
  const max = Math.max(1, ...stats.lastDays.map((d) => d.visits));

  return (
    <section className="mt-10 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <h2 className="text-sm font-semibold text-stone-500">
        Visits <span className="font-normal">(only you can see this)</span>
      </h2>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          ["Today", stats.lastDays[0]?.visits ?? 0],
          ["Total visits", stats.total],
          ["Unique visitors", stats.unique],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-stone-50 p-2">
            <dd className="text-2xl font-bold tabular-nums">{value}</dd>
            <dt className="text-xs text-stone-500">{label}</dt>
          </div>
        ))}
      </dl>
      <ul
        className="mt-3 flex h-16 items-end gap-1.5"
        aria-label="Visits in the last 7 days"
      >
        {stats.lastDays.toReversed().map((d) => (
          <li
            key={d.day}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            title={`${d.day}: ${d.visits}`}
          >
            <span className="text-[10px] tabular-nums text-stone-500">
              {d.visits}
            </span>
            <span
              className="w-full rounded-t bg-orange-400"
              style={{ height: `${(d.visits / max) * 100}%`, minHeight: 2 }}
            />
            <span className="text-[10px] text-stone-400">{weekday(d.day)}</span>
          </li>
        ))}
      </ul>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs text-stone-500">
          <tr>
            <th className="py-1 font-normal">Day</th>
            <th className="py-1 text-right font-normal">Visits</th>
            <th className="py-1 text-right font-normal">Unique visitors</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 tabular-nums">
          {stats.lastDays.map((d) => (
            <tr key={d.day}>
              <td className="py-1">
                {weekday(d.day)}{" "}
                <span className="text-stone-400">{d.day.slice(5)}</span>
              </td>
              <td className="py-1 text-right">{d.visits}</td>
              <td className="py-1 text-right">
                {d.unique ?? <span className="text-stone-400">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-stone-400">
        Unique visitors per day are counted from Oct 14 on; earlier days show –.
      </p>
    </section>
  );
}
