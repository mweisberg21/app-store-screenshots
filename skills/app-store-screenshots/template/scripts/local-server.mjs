import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { ensureAppleFrames } from "./apple-frame-files.mjs";

const mode = process.argv[2];
const args = process.argv.slice(3);
if (!["dev", "start"].includes(mode) || (args.length && (args.length !== 2 || args[0] !== "--port"))) {
  throw new Error("Usage: npm run dev -- --port 3000 (or npm start)");
}
const port = Number(args[1] || process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid port");
const frames = await ensureAppleFrames(fileURLToPath(new URL("../", import.meta.url)));
if (frames.source === "cache") console.log("Original Apple frames added from your local cache.");
if (!frames.ready) console.warn('Apple frames need a one-time import: npm run frames:import -- "/path/to/Apple Device Frames"');
const token = randomBytes(32).toString("hex");
const origin = `http://127.0.0.1:${port}`;
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), mode, "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: "inherit",
  env: { ...process.env, SCREENSHOT_EDITOR_TOKEN: token, SCREENSHOT_EDITOR_ORIGIN: origin },
});
console.log(`\nOpen this private local link after the server is ready:\n${origin}/unlock#${token}\n`);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
