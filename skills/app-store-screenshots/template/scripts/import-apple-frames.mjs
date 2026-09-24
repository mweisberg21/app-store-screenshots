import { readFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = process.argv[2];
if (!source) {
  console.error('Usage: npm run frames:import -- "/path/to/Apple Device Frames"');
  console.error("Download the matching product bezels from https://developer.apple.com/design/resources/");
  process.exit(1);
}
const frames = JSON.parse(await readFile(path.join(root, "src/lib/apple-frames.json"), "utf8"));
// Check every asset before changing the local installation. Measurements and
// masks apply to these exact originals, not to a resized or edited substitute.
const checked = [];
try {
  for (const frame of Object.values(frames)) {
    const file = path.join(path.resolve(source), frame.source);
    const bytes = await readFile(file);
    if (createHash("sha256").update(bytes).digest("hex") !== frame.sha256) {
      throw new Error(`${frame.source}: this file does not match the measured original.`);
    }
    checked.push({ frame, file });
  }
  const destination = path.join(root, "public/device-frames");
  await mkdir(destination, { recursive: true });
  for (const { frame, file } of checked) await copyFile(file, path.join(destination, frame.filename));
  console.log(`Imported ${checked.length} original Apple frame files for local use.`);
  console.log("Source assets remain under Apple's terms. Do not commit or redistribute them with this tool.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
