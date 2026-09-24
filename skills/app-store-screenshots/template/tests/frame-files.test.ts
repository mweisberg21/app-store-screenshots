import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, rename, cp, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importAppleFrames, ensureAppleFrames, frameManifest } from "../scripts/apple-frame-files.mjs";

test("the shipped template includes original PNGs that work without an import or cache", async () => {
  const template = fileURLToPath(new URL("../", import.meta.url));
  const directory = await mkdtemp(path.join(tmpdir(), "packaged frames-"));
  const root = path.join(directory, "new project");
  const cache = path.join(directory, "no operator cache");
  try {
    await mkdir(path.join(root, "src/lib"), {recursive: true});
    await cp(path.join(template, "src/lib/apple-frames.json"), path.join(root, "src/lib/apple-frames.json"));
    await cp(path.join(template, "public/device-frames"), path.join(root, "public/device-frames"), {recursive: true});
    const frames = await frameManifest(root);
    assert.equal(frames.length, 3);
    for (const frame of frames) {
      const bytes = await readFile(path.join(root, "public/device-frames", frame.filename));
      assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      assert.equal(bytes.readUInt32BE(16), frame.width);
      assert.equal(bytes.readUInt32BE(20), frame.height);
    }
    assert.deepEqual(await ensureAppleFrames(root, cache), {ready: true, source: "project"});
    await assert.rejects(access(cache), {code: "ENOENT"});
    await writeFile(path.join(root, "public/device-frames", frames[0].filename), "changed file");
    assert.deepEqual(await ensureAppleFrames(root, cache), {ready: false, source: "missing"});
  } finally { await rm(directory, {recursive: true, force: true}); }
});

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
