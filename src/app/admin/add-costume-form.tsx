"use client";

import { useRef, useState, useTransition } from "react";
import { entranceLabel, entrances } from "@/config";
import { addCostumeAction } from "./actions";

const MAX_SIZE = 1600;

// Shrinks the photo to at most 1600px and re-encodes it as JPG. Re-encoding
// through a canvas also drops the metadata, including GPS location.
async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't encode photo")),
      "image/jpeg",
      0.8,
    ),
  );
}

export function AddCostumeForm() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(
    null,
  );
  const [message, setMessage] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setMessage(null);
    if (!file) return;
    try {
      const blob = await preparePhoto(file);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
    } catch {
      e.target.value = "";
      setMessage({
        error: true,
        text: "This photo format isn't supported here. Try taking the photo again or use a JPG.",
      });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photo) {
      setMessage({ error: true, text: "Add a photo of the costume." });
      return;
    }
    const data = new FormData(e.currentTarget);
    data.set(
      "photo",
      new File([photo.blob], "photo.jpg", { type: "image/jpeg" }),
    );
    const name = String(data.get("name"));
    startTransition(async () => {
      const error = await addCostumeAction(data);
      if (error) {
        setMessage({ error: true, text: error });
        return;
      }
      formRef.current?.reset();
      URL.revokeObjectURL(photo.preview);
      setPhoto(null);
      setMessage({
        error: false,
        text: `Added “${name}”. It's on the site now.`,
      });
    });
  }

  if (!open) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white p-4 font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50"
        >
          + Add a costume
        </button>
        {message && !message.error && (
          <p className="mt-2 text-sm text-emerald-700">{message.text}</p>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mb-8 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Add a costume</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-stone-500 underline hover:text-stone-800"
        >
          Done
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Photo</span>
        <div className="mt-1 flex items-center gap-3">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview
            <img
              src={photo.preview}
              alt="Preview"
              className="size-20 shrink-0 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            name="photoFile"
            accept="image/*"
            onChange={onPhotoChange}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:font-semibold file:text-white"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Name</span>
        <input
          name="name"
          required
          maxLength={60}
          placeholder="e.g. Spider-Man"
          className="mt-1 w-full rounded-xl px-4 py-2.5 ring-1 ring-stone-300 focus:ring-2 focus:ring-stone-900 focus:outline-none"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">Where is it?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {entrances.map((entrance) => (
            <label
              key={entrance.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ring-stone-300 has-checked:bg-stone-900 has-checked:text-white has-checked:ring-stone-900"
            >
              <input
                type="radio"
                name="entrance"
                value={entrance.id}
                required
                className="sr-only"
              />
              <span
                className={`${entrance.color} size-3 shrink-0 rounded-full`}
                aria-hidden
              />
              <span>
                <span className="block font-semibold">
                  {entranceLabel(entrance)}
                </span>
                {entrance.sizes && (
                  <span className="block text-xs opacity-75">
                    {entrance.sizes}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {message && (
        <p
          className={`text-sm ${message.error ? "text-red-600" : "text-emerald-700"}`}
        >
          {message.text}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add costume"}
      </button>
    </form>
  );
}
