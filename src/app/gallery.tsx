"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { donationEntrances, entranceLabel, entrances } from "@/config";
import type { Costume } from "@/lib/costumes";
import { CostumeViewer } from "./viewer";

type Entrance = (typeof entrances)[number];

const entranceById = Object.fromEntries(
  entrances.map((e) => [e.id, e]),
) as Record<string, Entrance>;

export function Gallery({
  costumes,
  taken,
}: {
  costumes: Costume[];
  taken: string[];
}) {
  const takenSet = new Set(taken);
  const [entranceFilter, setEntranceFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Costume | null>(null);
  const galleryRef = useRef<HTMLElement>(null);

  // Taken costumes stay visible but move to the end.
  const visible = (
    entranceFilter
      ? costumes.filter((c) => c.entranceId === entranceFilter)
      : costumes
  ).toSorted((a, b) => Number(takenSet.has(a.id)) - Number(takenSet.has(b.id)));
  const availableCount = visible.filter((c) => !takenSet.has(c.id)).length;
  const countAt = (entranceId: string) =>
    costumes.filter((c) => c.entranceId === entranceId && !takenSet.has(c.id))
      .length;

  // The viewer flips through the costumes currently shown, wrapping around.
  const selectedIndex = selected
    ? visible.findIndex((c) => c.id === selected.id)
    : -1;
  const step = (by: number) =>
    visible[(selectedIndex + by + visible.length) % visible.length];

  function pickEntrance(entranceId: string) {
    setEntranceFilter(entranceId);
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section aria-labelledby="entrances-heading">
        <h2 id="entrances-heading" className="text-2xl font-bold">
          Where to find them
        </h2>
        <p className="mt-1 text-stone-600">
          Costumes are sorted by size in {entrances.length} places around the
          school. Tap one to see its costumes.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {entrances.map((entrance) => (
            <button
              key={entrance.id}
              onClick={() => pickEntrance(entrance.id)}
              className="flex gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200 transition hover:shadow-md"
            >
              <div
                className={`${entrance.color} w-2 shrink-0 self-stretch rounded-full`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{entranceLabel(entrance)}</h3>
                {entrance.sizes && (
                  <p className="text-sm font-medium text-stone-700">
                    {entrance.sizes}
                  </p>
                )}
                {entrance.where && (
                  <p className="text-sm text-stone-600">{entrance.where}</p>
                )}
                <p className="mt-1 text-sm text-stone-500">
                  {countAt(entrance.id)} available →
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
          <span className="text-2xl" aria-hidden>
            📦
          </span>
          <div>
            <h3 className="font-bold">Want to donate?</h3>
            <p className="text-sm text-stone-700">
              Drop clean, used costumes at the{" "}
              {listNames(donationEntrances.map((e) => e.name))} entrances.
            </p>
          </div>
        </div>
      </section>

      <section
        ref={galleryRef}
        aria-labelledby="gallery-heading"
        className="mt-12 scroll-mt-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="gallery-heading" className="text-2xl font-bold">
            Available costumes
          </h2>
          <p className="text-sm text-stone-500">
            {availableCount} available
            {availableCount < visible.length &&
              ` · ${visible.length - availableCount} taken`}
          </p>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by entrance"
        >
          <FilterChip
            active={entranceFilter === null}
            onClick={() => setEntranceFilter(null)}
          >
            All entrances
          </FilterChip>
          {entrances.map((entrance) => (
            <FilterChip
              key={entrance.id}
              active={entranceFilter === entrance.id}
              onClick={() => setEntranceFilter(entrance.id)}
            >
              {entrance.name}
              {entrance.sizes && ` · ${entrance.sizes}`}
            </FilterChip>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 rounded-2xl border-2 border-dashed border-stone-300 p-10 text-center text-stone-500">
            No costumes here yet. Check back soon!
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((costume, i) => {
              const entrance = entranceById[costume.entranceId];
              const isTaken = takenSet.has(costume.id);
              return (
                <li key={costume.id}>
                  <button
                    onClick={() => setSelected(costume)}
                    className="group block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-stone-200 transition hover:shadow-md"
                  >
                    <div
                      className={`relative aspect-[3/4] bg-stone-100 ${isTaken ? "opacity-50 grayscale" : ""}`}
                    >
                      <Image
                        src={costume.src}
                        alt={costume.name || "Costume"}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition group-hover:scale-105"
                        unoptimized={costume.src.endsWith(".svg")}
                        priority={i < 4}
                      />
                      {isTaken && <TakenBadge />}
                    </div>
                    <div className="p-3">
                      <p
                        className={`truncate font-semibold ${isTaken ? "text-stone-400 line-through" : ""}`}
                      >
                        {costume.name || "Costume"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-600">
                        <span
                          className={`${entrance.color} inline-block size-2.5 rounded-full`}
                          aria-hidden
                        />
                        {entranceLabel(entrance)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected && selectedIndex !== -1 && (
        <CostumeViewer
          costume={selected}
          entrance={entranceById[selected.entranceId]}
          taken={takenSet.has(selected.id)}
          position={`${selectedIndex + 1} / ${visible.length}`}
          neighbors={[step(-1), step(1)].map((c) => c.src)}
          onPrev={() => setSelected(step(-1))}
          onNext={() => setSelected(step(1))}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// ["Fir", "Cedar", "Cypress"] -> "Fir, Cedar or Cypress"
function listNames(names: string[]) {
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`
    : names.join("");
}

function TakenBadge() {
  return (
    <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-6 bg-stone-900/85 py-1.5 text-center text-sm font-bold tracking-widest text-white uppercase">
      Taken
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition ${
        active
          ? "bg-stone-900 text-white ring-stone-900"
          : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}
