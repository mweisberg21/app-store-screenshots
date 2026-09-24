import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, readFile, rm, writeFile, mkdir, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { accessError } from "../src/lib/local-access";
import { readJson, RequestError } from "../src/lib/request-body";
import { MAX_UPLOAD_BODY, parseImage, saveImage } from "../src/lib/upload-storage";
import { projectSchema } from "../src/lib/project-schema";
import { GET, POST } from "../src/app/api/project/route";
import { POST as upload } from "../src/app/api/upload/route";
import { POST as session } from "../src/app/api/session/route";

const origin = "http://127.0.0.1:39873";
const token = "ab".repeat(32);
const cwd = process.cwd();
const oldToken = process.env.SCREENSHOT_EDITOR_TOKEN;
const oldOrigin = process.env.SCREENSHOT_EDITOR_ORIGIN;
let root: string;
let project: any;
let png: Buffer;
function request(route: string, body?: unknown, overrides: Record<string, string> = {}) {
  return new Request(origin + route, {
    method: body === undefined ? "GET" : "POST",
    headers: { host: "127.0.0.1:39873", origin, cookie: `screenshot_editor_39873=${token}`, "content-type": "application/json", ...overrides },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const status = (code: number) => (error: unknown) => error instanceof RequestError && error.status === code;
before(async () => {
  project = JSON.parse(await readFile(path.join(cwd, "app-store-screenshots.json"), "utf8"));
  png = await readFile(path.join(cwd, "public/mockup.png"));
  root = await mkdtemp(path.join(tmpdir(), "screenshot-security-"));
  process.env.SCREENSHOT_EDITOR_TOKEN = token;
  process.env.SCREENSHOT_EDITOR_ORIGIN = origin;
  process.chdir(root);
});
after(async () => {
  process.chdir(cwd);
  if (oldToken === undefined) delete process.env.SCREENSHOT_EDITOR_TOKEN; else process.env.SCREENSHOT_EDITOR_TOKEN = oldToken;
  if (oldOrigin === undefined) delete process.env.SCREENSHOT_EDITOR_ORIGIN; else process.env.SCREENSHOT_EDITOR_ORIGIN = oldOrigin;
  await rm(root, { recursive: true, force: true });
});
test("requests need a session and the configured host", () => {
  assert.equal(accessError(request("/api/project", undefined, { cookie: "" }))?.status, 401);
  assert.equal(accessError(request("/api/project", undefined, { host: "attacker.example:39873" }))?.status, 403);
  assert.equal(accessError(request("/api/project")), null);
});
test("missing server secret fails closed", () => {
  delete process.env.SCREENSHOT_EDITOR_TOKEN;
  assert.equal(accessError(request("/api/project"))?.status, 503);
  process.env.SCREENSHOT_EDITOR_TOKEN = token;
});
test("writes require an exact origin", () => {
  assert.equal(accessError(request("/api/project", {}, { origin: "https://attacker.example" }))?.status, 403);
  assert.equal(accessError(request("/api/project", {}, { origin: "null" }))?.status, 403);
});
test("session exchange rejects a wrong token and sets a protected cookie", async () => {
  assert.equal((await session(request("/api/session", { token: "wrong" }, { cookie: "" }))).status, 401);
  const result = await session(request("/api/session", { token }, { cookie: "" }));
  assert.equal(result.status, 200);
  assert.match(result.headers.get("set-cookie")!, /HttpOnly/);
  assert.match(result.headers.get("set-cookie")!, /SameSite=strict/i);
});
test("request reader rejects non-JSON and a declared excessive length", async () => {
  await assert.rejects(readJson(request("/api/project", {}, { "content-type": "text/plain" }), 256), status(415));
  await assert.rejects(readJson(request("/api/project", {}, { "content-length": "257" }), 256), status(413));
});
test("stream limit applies without Content-Length and cancels excess data", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('"123456789"')); },
    cancel() { cancelled = true; },
  });
  const req = new Request(origin, { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
  await assert.rejects(readJson(req, 8), status(413));
  assert.equal(cancelled, true);
});
test("invalid JSON is rejected and bounded valid JSON is accepted", async () => {
  assert.deepEqual(await readJson(request("/", { hello: "world" }), 100), { hello: "world" });
  const req = new Request(origin, { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
  await assert.rejects(readJson(req, 100), status(400));
});
test("schema accepts the starter and rejects unsafe locale and remote images", () => {
  assert.equal(projectSchema.safeParse(project).success, true);
  assert.equal(projectSchema.safeParse({ ...project, locales: ["../../out"], locale: "../../out" }).success, false);
  assert.equal(projectSchema.safeParse({ ...project, appIcon: "//attacker.example/image" }).success, false);
});
test("unauthorized and malformed saves leave existing work unchanged", async () => {
  const file = path.join(root, "app-store-screenshots.json");
  await writeFile(file, JSON.stringify(project));
  const before = await readFile(file, "utf8");
  assert.equal((await POST(request("/api/project", {}, { cookie: "" }))).status, 401);
  assert.equal((await POST(request("/api/project", {}))).status, 400);
  assert.equal(await readFile(file, "utf8"), before);
});
test("authenticated save and read preserve the project", async () => {
  const edited = { ...project, appName: "Security test" };
  assert.equal((await POST(request("/api/project", edited))).status, 200);
  const response = await GET(request("/api/project"));
  assert.equal((await response.json()).state.appName, "Security test");
  assert.equal((await readdir(root)).some((name) => name.endsWith(".tmp")), false);
});
test("image parser rejects invalid signatures and excessive encoded input", () => {
  assert.throws(() => parseImage("data:image/png;base64,AAAA"), status(400));
  assert.throws(() => parseImage("x".repeat(MAX_UPLOAD_BODY)), status(413));
  assert.equal(parseImage(`data:image/png;base64,${png.toString("base64")}`).bytes.length, png.length);
});
test("quota counts distinct files, allows duplicates and releases lock", async () => {
  const directory = path.join(root, "quota");
  const image = parseImage(`data:image/png;base64,${png.toString("base64")}`);
  const first = await saveImage(directory, image, png.length);
  assert.equal(await saveImage(directory, image, png.length), first);
  await assert.rejects(saveImage(directory, { ...image, bytes: Buffer.concat([png, Buffer.from([1])]) }, png.length), status(413));
  assert.equal((await readdir(path.join(directory, "public/screenshots/uploaded"))).length, 1);
});
test("concurrent upload lock rejects a write without allocating a file", async () => {
  const directory = path.join(root, "locked");
  await mkdir(path.join(directory, "public/screenshots/uploaded/.write-lock"), { recursive: true });
  await assert.rejects(saveImage(directory, { bytes: Buffer.from(png), ext: "png" }), status(409));
});
test("upload API requires access and stores a valid image", async () => {
  const body = { dataUrl: `data:image/png;base64,${png.toString("base64")}` };
  assert.equal((await upload(request("/api/upload", body, { cookie: "" }))).status, 401);
  const response = await upload(request("/api/upload", body));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.match(result.path, /^\/screenshots\/uploaded\/[a-f0-9]{64}\.png$/);
  assert.deepEqual(await readFile(path.join(root, "public", result.path)), png);
});
