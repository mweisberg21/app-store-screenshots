import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { RequestError } from "./request-body";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOAD_BODY = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 256;
export const MAX_UPLOAD_STORAGE = 256 * 1024 * 1024;
const MAX_UPLOAD_FILES = 1000;

export function parseImage(dataUrl: unknown) {
  if (typeof dataUrl !== "string") throw new RequestError(400, "Missing dataUrl");
  if (dataUrl.length > MAX_UPLOAD_BODY - 128) throw new RequestError(413, "Image too large (>8MB)");
  const match = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[2].length % 4 !== 0) throw new RequestError(400, "Use a PNG or JPEG data URL");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new RequestError(413, "Image too large (>8MB)");
  const png = match[1] === "png";
  const valid = png ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid) throw new RequestError(400, "Image signature does not match its type");
  return { bytes, ext: png ? "png" : "jpg" };
}

export async function saveImage(root: string, image: ReturnType<typeof parseImage>, quota = MAX_UPLOAD_STORAGE) {
  const directory = path.join(root, "public", "screenshots", "uploaded");
  await fs.mkdir(directory, { recursive: true });
  // A filesystem lock also protects the quota when two server processes use one project.
  const lock = path.join(directory, ".write-lock");
  try { await fs.mkdir(lock); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new RequestError(409, "Another upload is in progress. Try again.");
    throw error;
  }
  const filename = `${createHash("sha256").update(image.bytes).digest("hex")}.${image.ext}`;
  const target = path.join(directory, filename);
  try {
    let used = 0;
    let files = 0;
    let existing = false;
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name === ".write-lock") continue;
      if (!entry.isFile()) throw new RequestError(409, "Upload directory contains an unexpected entry");
      used += (await fs.stat(path.join(directory, entry.name))).size;
      files++;
      if (entry.name === filename) existing = true;
    }
    if (existing) return `/screenshots/uploaded/${filename}`;
    if (used + image.bytes.length > quota || files >= MAX_UPLOAD_FILES) throw new RequestError(413, "Upload storage limit reached. Remove unused images before uploading.");
    try { await fs.writeFile(target, image.bytes, { flag: "wx", mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") { await fs.unlink(target).catch(() => {}); throw error; } }
    return `/screenshots/uploaded/${filename}`;
  } finally { await fs.rmdir(lock); }
}
