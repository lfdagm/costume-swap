import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import { getCostumes } from "@/lib/costumes";
import { getTaken } from "@/lib/taken";
import { logOutAction } from "./actions";
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

  const [costumes, taken] = [getCostumes(), await getTaken()];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      <header className="flex items-center justify-between gap-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Mark costumes as taken</h1>
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
      <AdminList costumes={costumes} taken={taken} />
    </main>
  );
}
