import { fileURLToPath } from "node:url";
import { importAppleFrames } from "./apple-frame-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = process.argv[2];
if (!source) {
  console.error('Usage: npm run frames:import -- "/path/to/Apple Device Frames"');
  console.error("Download the matching product bezels from https://developer.apple.com/design/resources/");
  process.exit(1);
}
try {
  const count = await importAppleFrames(root, source);
  console.log(`Imported ${count} original Apple frame files into this project and the local cache.`);
  console.log("New projects will include these frames automatically when the editor starts.");
  console.log("Source assets remain under Apple's terms. Do not commit or redistribute them with this tool.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
