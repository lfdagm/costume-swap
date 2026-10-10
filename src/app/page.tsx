import { connection } from "next/server";
import { Suspense } from "react";
import { event } from "@/config";
import { getCostumes } from "@/lib/costumes";
import { getTaken } from "@/lib/taken";
import { getAllCostumes } from "@/lib/uploads";
import { Gallery } from "./gallery";

export default function Home() {
  const costumes = getCostumes();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16">
      <header className="py-10 text-center sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
          {event.organizer}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          🎃 {event.title}
        </h1>
        <p className="mt-2 text-lg font-medium text-stone-600">{event.dates}</p>
        <p className="mx-auto mt-4 max-w-2xl text-stone-700">{event.intro}</p>
      </header>

      <Suspense fallback={<Gallery costumes={costumes} taken={[]} />}>
        <LiveGallery />
      </Suspense>

      <section className="mt-14 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-xl font-bold">How it works</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-stone-700">
          {event.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// Reads uploaded costumes and the taken list on every visit so they're current.
async function LiveGallery() {
  await connection();
  const [costumes, taken] = await Promise.all([getAllCostumes(), getTaken()]);
  return <Gallery costumes={costumes} taken={taken} />;
}
