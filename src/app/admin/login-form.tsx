"use client";

import { useActionState } from "react";
import { logInAction } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(logInAction, null);

  return (
    <form action={action} className="mt-6 space-y-3">
      <input
        type="password"
        name="password"
        required
        autoFocus
        placeholder="Password"
        className="w-full rounded-xl bg-white px-4 py-3 ring-1 ring-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
