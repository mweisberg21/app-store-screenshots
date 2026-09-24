import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { importAppleFrames, ensureAppleFrames } from "../scripts/apple-frame-files.mjs";

async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "frame files-"));
  const root = path.join(directory, "project"), source = path.join(directory, "originals"), cache = path.join(directory, "cache");
  await mkdir(path.join(root, "src/lib"), { recursive: true });
  await mkdir(source);
  const frames = ["phone", "tablet"].map(name => {
    const bytes = Buffer.from(`Test bytes for ${name}`);
    return { source: `${name}-original.png`, filename: `${name}.png`, sha256: createHash("sha256").update(bytes).digest("hex"), bytes };
  });
  for (const frame of frames) await writeFile(path.join(source, frame.source), frame.bytes);
  await writeFile(path.join(root, "src/lib/apple-frames.json"), JSON.stringify(frames));
  return { directory, root, source, cache, frames };
}

test("one import gives later projects their own verified copies without the source folder", async () => {
  const f = await fixture();
  try {
    assert.equal(await importAppleFrames(f.root, f.source, f.cache), 2);
    await rm(f.source, { recursive: true });
    await rm(path.join(f.root, "public/device-frames"), { recursive: true });
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: true, source: "cache" });
    for (const frame of f.frames) assert.deepEqual(await readFile(path.join(f.root, "public/device-frames", frame.filename)), frame.bytes);
    await rm(f.cache, { recursive: true });
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: true, source: "project" });
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("a bad source leaves the existing project and cache unchanged", async () => {
  const f = await fixture();
  try {
    await importAppleFrames(f.root, f.source, f.cache);
    await writeFile(path.join(f.source, f.frames[1].source), "wrong file");
    await assert.rejects(importAppleFrames(f.root, f.source, f.cache), /does not match/);
    for (const frame of f.frames) {
      assert.deepEqual(await readFile(path.join(f.root, "public/device-frames", frame.filename)), frame.bytes);
      assert.deepEqual(await readFile(path.join(f.cache, frame.filename)), frame.bytes);
    }
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("missing frames stay unavailable until a valid local source exists", async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: false, source: "missing" });
    await importAppleFrames(f.root, f.source, f.cache);
    await writeFile(path.join(f.root, "public/device-frames", f.frames[0].filename), "changed file");
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: true, source: "cache" });
    await rm(path.join(f.root, "public/device-frames"), { recursive: true });
    await writeFile(path.join(f.cache, f.frames[1].filename), "changed file");
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: false, source: "missing" });
    await assert.rejects(readFile(path.join(f.root, "public/device-frames", f.frames[0].filename)), { code: "ENOENT" });
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("portable names import unchanged bytes without Windows-invalid Apple names", async () => {
  const f = await fixture();
  try {
    for (const frame of f.frames) {
      await rename(path.join(f.source, frame.source), path.join(f.source, frame.filename));
      frame.source = `Originals/Tablet 13\" - ${frame.filename}`;
    }
    await writeFile(path.join(f.root, "src/lib/apple-frames.json"), JSON.stringify(f.frames));
    assert.equal(await importAppleFrames(f.root, f.source, f.cache), 2);
    for (const frame of f.frames) {
      assert.deepEqual(await readFile(path.join(f.root, "public/device-frames", frame.filename)), frame.bytes);
      assert.deepEqual(await readFile(path.join(f.cache, frame.filename)), frame.bytes);
    }
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("portable imports still reject changed bytes before writing any files", async () => {
  const f = await fixture();
  try {
    await importAppleFrames(f.root, f.source, f.cache);
    for (const frame of f.frames) await writeFile(path.join(f.source, frame.filename), frame.bytes);
    await writeFile(path.join(f.source, f.frames[1].filename), "modified image");
    await assert.rejects(importAppleFrames(f.root, f.source, f.cache), /does not match/);
    for (const frame of f.frames) {
      assert.deepEqual(await readFile(path.join(f.root, "public/device-frames", frame.filename)), frame.bytes);
      assert.deepEqual(await readFile(path.join(f.cache, frame.filename)), frame.bytes);
    }
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});

test("an import can combine original paths with portable filenames", async () => {
  const f = await fixture();
  try {
    const frame = f.frames[1];
    await rename(path.join(f.source, frame.source), path.join(f.source, frame.filename));
    assert.equal(await importAppleFrames(f.root, f.source, f.cache), 2);
    assert.deepEqual(await ensureAppleFrames(f.root, f.cache), { ready: true, source: "project" });
  } finally { await rm(f.directory, { recursive: true, force: true }); }
});
