"use client";

import Image from "next/image";
import { useOptimistic, useState, useTransition } from "react";
import { entranceLabel, entrances } from "@/config";
import type { Costume } from "@/lib/costumes";
import { setTakenAction } from "./actions";

export function AdminList({
  costumes,
  taken,
}: {
  costumes: Costume[];
  taken: string[];
}) {
  const [optimisticTaken, setOptimisticTaken] = useOptimistic(
    new Set(taken),
    (current, { id, value }: { id: string; value: boolean }) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    },
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const value = !optimisticTaken.has(id);
    setError(null);
    startTransition(async () => {
      setOptimisticTaken({ id, value });
      try {
        await setTakenAction(id, value);
      } catch {
        setError(
          "Couldn't save that change. Check your connection and try again.",
        );
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
      {entrances.map((entrance) => {
        const here = costumes.filter((c) => c.entranceId === entrance.id);
        if (here.length === 0) return null;
        const available = here.filter((c) => !optimisticTaken.has(c.id)).length;
        return (
          <section key={entrance.id}>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span
                className={`${entrance.color} inline-block size-3 rounded-full`}
                aria-hidden
              />
              {entranceLabel(entrance)}
              <span className="text-sm font-normal text-stone-500">
                {available} of {here.length} available
              </span>
            </h2>
            <ul className="mt-2 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
              {here.map((costume) => {
                const isTaken = optimisticTaken.has(costume.id);
                return (
                  <li key={costume.id} className="flex items-center gap-3 p-2">
                    <div
                      className={`relative size-16 shrink-0 overflow-hidden rounded-lg bg-stone-100 ${isTaken ? "opacity-40 grayscale" : ""}`}
                    >
                      <Image
                        src={costume.src}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <p
                      className={`min-w-0 flex-1 truncate font-medium ${isTaken ? "text-stone-400 line-through" : ""}`}
                    >
                      {costume.name || "Costume"}
                    </p>
                    <button
                      onClick={() => toggle(costume.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                        isTaken
                          ? "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100"
                          : "bg-stone-900 text-white hover:bg-stone-700"
                      }`}
                    >
                      {isTaken ? "Undo" : "Mark taken"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
