import fs from "node:fs";
import path from "node:path";
import { entrances } from "@/config";

export type Costume = {
  id: string; // the photo's file name, so it stays the same if the costume moves entrance
  src: string;
  name: string;
  entranceId: string;
  uploaded?: boolean; // added from /admin rather than the photo folders
};

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const COSTUMES_DIR = path.join(process.cwd(), "public", "costumes");

// "1086-darth-vader.jpg" -> "Darth Vader". Camera names like IMG_1234 get no name.
function nameFromFile(file: string): string {
  const base = file.replace(/\.[^.]+$/, "");
  if (/^(img|dsc|pxl|photo|image)[-_ ]?\d+/i.test(base)) return "";
  return base
    .replace(/^\d+[-_ ]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Reads public/costumes/<entrance id>/* at build time.
export function getCostumes(): Costume[] {
  const costumes: Costume[] = [];

  for (const entrance of entrances) {
    const dir = path.join(COSTUMES_DIR, entrance.id);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).sort()) {
      if (/\.heic$/i.test(file)) {
        console.warn(
          `Skipping ${entrance.id}/${file}: HEIC isn't supported by most browsers, export it as JPG.`,
        );
        continue;
      }
      if (!IMAGE_EXT.test(file)) continue;
      costumes.push({
        id: file,
        src: `/costumes/${entrance.id}/${encodeURIComponent(file)}`,
        name: nameFromFile(file),
        entranceId: entrance.id,
      });
    }
  }

  return costumes;
}
