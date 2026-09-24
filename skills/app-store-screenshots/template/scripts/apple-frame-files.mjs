import { readFile, mkdir, writeFile, rename, rm } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

export function defaultFrameCache() {
  if (process.env.SCREENSHOT_FRAME_CACHE_DIR) return path.resolve(process.env.SCREENSHOT_FRAME_CACHE_DIR);
  const base = process.platform === "darwin" ? path.join(homedir(), "Library/Application Support")
    : process.platform === "win32" ? process.env.LOCALAPPDATA || path.join(homedir(), "AppData/Local")
    : process.env.XDG_DATA_HOME || path.join(homedir(), ".local/share");
  return path.join(base, "app-store-screenshots", "device-frames");
}

export async function frameManifest(root) {
  return Object.values(JSON.parse(await readFile(path.join(root, "src/lib/apple-frames.json"), "utf8")));
}

async function checkedFiles(directory, frames, originalPaths = false) {
  const files = [];
  for (const frame of frames) {
    let relative = frame.filename;
    let bytes;
    try {
      // Portable names let Windows import originals whose Apple names contain
      // a quote character. Only the name changes; the bytes must still match.
      bytes = await readFile(path.join(directory, relative));
    } catch (error) {
      if (!originalPaths || error.code !== "ENOENT") throw error;
      relative = frame.source;
      bytes = await readFile(path.join(directory, relative));
    }
    if (createHash("sha256").update(bytes).digest("hex") !== frame.sha256) {
      throw new Error(`${relative}: this file does not match the measured original.`);
    }
    files.push({ filename: frame.filename, bytes });
  }
  return files;
}

async function saveFiles(directory, files) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const { filename, bytes } of files) {
    const target = path.join(directory, filename);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, bytes);
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}

export async function importAppleFrames(root, source, cache = defaultFrameCache()) {
  const frames = await frameManifest(root);
  // Validate every source before changing either destination. Copy the checked
  // bytes, so a later change to a source path cannot bypass the hash check.
  const files = await checkedFiles(path.resolve(source), frames, true);
  await saveFiles(cache, files);
  await saveFiles(path.join(root, "public/device-frames"), files);
  return files.length;
}

export async function ensureAppleFrames(root, cache = defaultFrameCache()) {
  const frames = await frameManifest(root);
  const destination = path.join(root, "public/device-frames");
  try {
    await checkedFiles(destination, frames);
    return { ready: true, source: "project" };
  } catch {
    // An intact project is self-contained. Restore missing or changed files
    // only from the matching originals in this operator's local cache.
  }
  let files;
  try {
    files = await checkedFiles(cache, frames);
  } catch {
    return { ready: false, source: "missing" };
  }
  await saveFiles(destination, files);
  return { ready: true, source: "cache" };
}
