"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logIn, logOut } from "@/lib/auth";
import { setTaken } from "@/lib/taken";

export async function logInAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const ok = await logIn(String(formData.get("password") ?? ""));
  if (!ok) return "Wrong password, try again.";
  redirect("/admin");
}

export async function logOutAction() {
  await logOut();
  redirect("/admin");
}

export async function setTakenAction(id: string, taken: boolean) {
  if (!(await isAdmin())) throw new Error("Not logged in");
  await setTaken(id, taken);
  revalidatePath("/");
  revalidatePath("/admin");
}
