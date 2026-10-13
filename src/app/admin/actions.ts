"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { entrances } from "@/config";
import { isAdmin, logIn, logOut } from "@/lib/auth";
import { setTaken } from "@/lib/taken";
import { addCostume, deleteCostume } from "@/lib/uploads";

export async function logInAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const result = await logIn(String(formData.get("password") ?? ""));
  if (result === "too-many")
    return "Too many attempts. Wait 15 minutes and try again.";
  if (result === "wrong") return "Wrong password, try again.";
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

// Returns an error message, or null on success.
export async function addCostumeAction(
  formData: FormData,
): Promise<string | null> {
  if (!(await isAdmin())) return "Your session expired. Log in again.";
  const name = String(formData.get("name") ?? "").trim();
  const entranceId = String(formData.get("entrance") ?? "");
  const photo = formData.get("photo");
  if (!name || name.length > 60)
    return "Give the costume a name (up to 60 characters).";
  if (!entrances.some((e) => e.id === entranceId))
    return "Choose where the costume is.";
  if (
    !(photo instanceof Blob) ||
    photo.type !== "image/jpeg" ||
    photo.size === 0
  )
    return "Add a photo of the costume.";
  try {
    await addCostume(name, entranceId, photo);
  } catch (e) {
    console.error(e);
    return "Couldn't save the costume. Make sure the file is a photo and try again.";
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return null;
}

export async function deleteCostumeAction(id: string) {
  if (!(await isAdmin())) throw new Error("Not logged in");
  await deleteCostume(id);
  revalidatePath("/");
  revalidatePath("/admin");
}
