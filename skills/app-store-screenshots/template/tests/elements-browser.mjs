import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  cp,
  symlink,
  readFile,
  writeFile,
  rm,
  mkdir,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import net from "node:net";
import { createRequire } from "node:module";
const source = process.cwd(),
  require = createRequire(source + "/package.json"),
  JSZip = require("jszip"),
  sharp = require("sharp");
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const directory = await mkdtemp(path.join(tmpdir(), "elements-browser-"));
const resultDir = process.argv[2] || path.join(directory, "results");
await mkdir(resultDir, { recursive: true });
for (const name of [
  "scripts",
  "src",
  "package.json",
  "next.config.mjs",
  "app-store-screenshots.json",
  "public",
])
  await cp(path.join(source, name), path.join(directory, name), {
    recursive: true,
  });
for (const name of ["node_modules", ".next"])
  await symlink(
    path.join(source, name),
    path.join(directory, name),
    process.platform === "win32" ? "junction" : "dir",
  );
const fixture = JSON.parse(
  await readFile(path.join(directory, "app-store-screenshots.json"), "utf8"),
);
fixture.appName = "Element checks";
fixture.device = "iphone";
fixture.slidesByDevice.iphone = [
  {
    id: "first",
    layout: "no-device",
    headline: { en: "Explore your classes" },
    label: {},
    screenshot: "",
  },
  {
    id: "second",
    layout: "no-device",
    headline: { en: "Meet your teacher" },
    label: {},
    screenshot: "",
  },
];
await writeFile(
  path.join(directory, "app-store-screenshots.json"),
  JSON.stringify(fixture),
);
const server = net.createServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
await new Promise((r) => server.close(r));
const child = spawn(
  process.execPath,
  ["scripts/local-server.mjs", "start", "--port", String(port)],
  {
    cwd: directory,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      SCREENSHOT_FRAME_CACHE_DIR: path.join(directory, "empty-cache"),
    },
  },
);
let output = "",
  browser,
  page;
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
const origin = `http://127.0.0.1:${port}`;
try {
  for (let i = 0; i < 200; i++) {
    try {
      if ((await fetch(origin + "/unlock")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const token = output.match(/\/unlock#([a-f0-9]{64})/)?.[1];
  assert.ok(token);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/unlock#" + token);
  await page.waitForURL(origin + "/");
  await page.getByRole("textbox", { name: "App name", exact: true }).waitFor();
  const state = async () =>
    JSON.parse(
      await readFile(
        path.join(directory, "app-store-screenshots.json"),
        "utf8",
      ),
    );
  async function saved(check) {
    for (let i = 0; i < 100; i++) {
      const p = await state();
      if (check(p)) return p;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error("Save did not complete");
  }
  async function add(name) {
    await page
      .getByRole("button", { name: "Add element", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Add an element" });
    await dialog
      .getByRole("button", { name: new RegExp("^" + name + " ") })
      .click();
  }
  await page.getByRole("button", { name: "Add element", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Add an element" })
    .screenshot({ path: path.join(resultDir, "element-picker.png") });
  await page.keyboard.press("Escape");
  await add("Shape");
  await page.getByLabel("Fill color", { exact: true }).fill("#bb503c");
  await page.getByLabel("Width", { exact: true }).fill("300");
  await page.getByLabel("Height", { exact: true }).fill("200");
  await page.getByLabel("X position", { exact: true }).fill("80");
  await page.getByLabel("Y position", { exact: true }).fill("1800");
  let p = await saved(
    (p) => p.slidesByDevice.iphone[0].elements?.[0]?.transform.y === 1800,
  );
  const shape = p.slidesByDevice.iphone[0].elements[0];
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 1);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 2);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 1);
  await page.getByRole("button", { name: "Edit Shape", exact: true }).click();
  await page.getByRole("button", { name: "Lock Shape", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements[0].locked);
  assert.equal(
    await page.getByLabel("Width", { exact: true }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Unlock Shape", exact: true }).click();
  await page.getByRole("button", { name: "Hide Shape", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements[0].hidden);
  assert.equal(
    await page.locator(`[data-canvas-element="${shape.id}"]`).count(),
    0,
  );
  await page.getByRole("button", { name: "Show Shape", exact: true }).click();
  await add("Text");
  await page
    .getByLabel("Element text", { exact: true })
    .fill("Move at your pace");
  await page.getByLabel("Text size", { exact: true }).fill("48");
  await page.getByLabel("Y position", { exact: true }).fill("2050");
  await saved(
    (p) =>
      p.slidesByDevice.iphone[0].elements?.[1]?.text.en === "Move at your pace",
  );
  await page
    .getByRole("checkbox", { name: "Select Shape for group", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Select Text for group", exact: true })
    .check();
  await page.getByRole("button", { name: "Group", exact: true }).click();
  p = await saved((p) => p.slidesByDevice.iphone[0].elements[0].groupId);
  assert.equal(
    p.slidesByDevice.iphone[0].elements[0].groupId,
    p.slidesByDevice.iphone[0].elements[1].groupId,
  );
  const beforeMove = structuredClone(p.slidesByDevice.iphone[0].elements);
  const hit = await page
    .locator(`main [data-canvas-element="${shape.id}"]`)
    .boundingBox();
  assert.ok(hit);
  await page.mouse.move(hit.x + hit.width / 2, hit.y + hit.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    hit.x + hit.width / 2 + 35,
    hit.y + hit.height / 2 + 12,
    { steps: 8 },
  );
  await page.mouse.up();
  p = await saved(
    (p) =>
      p.slidesByDevice.iphone[0].elements[0].transform.x !==
      beforeMove[0].transform.x,
  );
  const moved = p.slidesByDevice.iphone[0].elements;
  assert.ok(
    Math.abs(
      moved[0].transform.x -
        beforeMove[0].transform.x -
        (moved[1].transform.x - beforeMove[1].transform.x),
    ) < 0.01,
  );
  assert.ok(
    Math.abs(
      moved[0].transform.y -
        beforeMove[0].transform.y -
        (moved[1].transform.y - beforeMove[1].transform.y),
    ) < 0.01,
  );
  const beforeKey = moved[0].transform.x;
  await page.keyboard.press("Shift+ArrowRight");
  await saved(
    (p) =>
      Math.abs(
        p.slidesByDevice.iphone[0].elements[0].transform.x - beforeKey - 10,
      ) < 0.01,
  );
  await page.getByRole("button", { name: "Save group", exact: true }).click();
  await page.getByLabel("Group name").fill("Useful caption");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save group", exact: true })
    .click();
  await saved((p) => p.savedGroups?.[0]?.name === "Useful caption");
  await page
    .getByRole("button", { name: "Copy to screens", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Copy elements", exact: true })
    .click();
  await saved((p) => p.slidesByDevice.iphone[1].elements?.length === 2);
  await page.getByRole("tab", { name: "Assets", exact: true }).click();
  await page.getByRole("button", { name: "Use group", exact: true }).click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 4);
  await page.getByRole("tab", { name: "Assets", exact: true }).click();
  const imageFile = path.join(directory, "customer-photo.png");
  await sharp({
    create: { width: 1320, height: 2868, channels: 4, background: "#72947c" },
  })
    .png()
    .toFile(imageFile);
  await page.getByLabel("Upload library images").setInputFiles(imageFile);
  p = await saved((p) =>
    p.assets?.some((a) => a.name === "customer-photo.png"),
  );
  const imagePath = p.assets.find((a) => a.name === "customer-photo.png").src;
  await page.getByRole("button", { name: "Rename customer-photo.png" }).click();
  await page
    .getByLabel("Asset type", { exact: true })
    .selectOption("screenshot");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await saved(
    (p) =>
      p.assets.find((a) => a.name === "customer-photo.png")?.category ===
      "screenshot",
  );

  await page
    .getByRole("button", { name: "Use customer-photo.png", exact: true })
    .click();
  await saved((p) => p.slidesByDevice.iphone[0].elements.length === 5);
  await page.getByText("Crop and zoom", { exact: true }).click();
  await page.getByLabel("Element image zoom", { exact: true }).fill("1.5");
  await saved(
    (p) => p.slidesByDevice.iphone[0].elements[4].asset.crop?.zoom === 1.5,
  );
  for (const name of [
    "Logo",
    "Device",
    "Screenshot detail",
    "Content cards",
    "Line or arrow",
    "Icon",
  ])
    await add(name);
  p = await saved((p) => p.slidesByDevice.iphone[0].elements.length === 11);
  assert.equal(
    new Set(p.slidesByDevice.iphone[0].elements.map((e) => e.kind)).size,
    9,
  );
  // Fill source assets through the file API after exercising every add action.
  const elems = p.slidesByDevice.iphone[0].elements;
  elems.forEach((e, i) => {
    e.transform = {
      ...e.transform,
      x: 80 + (i % 3) * 360,
      y: 900 + Math.floor(i / 3) * 430,
      width: 280,
      height: 300,
    };
    e.groupId = undefined;
    if (e.kind === "text") e.transform.height = 180;
    if (["image", "logo", "detail"].includes(e.kind)) e.asset.src = imagePath;
    if (e.kind === "device") {
      e.src = imagePath;
      e.transform.height = (280 * 3000) / 1470;
    }
    if (e.kind === "cards")
      e.items.forEach((item, j) => {
        item.asset.src = imagePath;
        item.title = { en: `Class ${j + 1}` };
      });
  });
  p.slidesByDevice.iphone = p.slidesByDevice.iphone.slice(0, 1);
  const put = async (p) => {
    const res = await page.request.post(origin + "/api/project", {
      headers: { Origin: origin },
      data: p,
    });
    assert.equal(res.status(), 200);
    await page.reload();
    await page
      .getByRole("textbox", { name: "App name", exact: true })
      .waitFor();
  };
  await put(p);
  await page.getByRole("tab", { name: "Elements", exact: true }).click();
  await page.screenshot({ path: path.join(resultDir, "elements-editor.png") });
  let pending = page.waitForEvent("download", { timeout: 120000 });
  await page
    .getByRole("button", { name: "Export bundle", exact: true })
    .click();
  const download = await Promise.race([
    pending,
    page
      .getByRole("dialog", { name: "Complete these items before export" })
      .waitFor({ timeout: 120000 })
      .then(async () => {
        throw new Error(await page.getByRole("dialog").innerText());
      }),
  ]);
  const zip = await JSZip.loadAsync(await readFile(await download.path()));
  const pngs = Object.values(zip.files).filter(
    (f) => f.name.startsWith("ios/") && f.name.endsWith(".png"),
  );
  assert.equal(pngs.length, 4);
  const png = await pngs[0].async("nodebuffer");
  await writeFile(path.join(resultDir, "elements-export.png"), png);
  const pixel = await sharp(png)
    .extract({ left: 100, top: 950, width: 1, height: 1 })
    .raw()
    .toBuffer();
  assert.deepEqual([...pixel.subarray(0, 3)], [187, 80, 60]);
  p.locales = ["en", "de"];
  p.slidesByDevice.iphone[0].headline.de = "Ihre Kurse";
  await put(p);
  await page
    .getByRole("button", { name: "Export bundle", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Complete these items before export" })
    .waitFor();
  assert.match(await page.getByRole("dialog").innerText(), /DE/);
  await page.getByRole("button", { name: "Back to editor" }).click();
  p.locales = ["en"];
  p.slidesByDevice.iphone[0].elements.find(
    (e) => e.kind === "image",
  ).asset.src = "/missing.png";
  await put(p);
  await page
    .getByRole("button", { name: "Export bundle", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Complete these items before export" })
    .waitFor();
  assert.match(await page.getByRole("dialog").innerText(), /could not load/);
  await page.getByRole("button", { name: "Back to editor" }).click();
  await page.setViewportSize({ width: 780, height: 1000 });
  await page.getByRole("tab", { name: "Assets", exact: true }).click();
  await page.screenshot({ path: path.join(resultDir, "elements-narrow.png") });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 632, height: 754 });
  assert.ok((await page.locator("main").boundingBox()).height >= 400);
  await page.getByLabel("Active screen", { exact: true }).selectOption("first");
  await page.getByRole("button", { name: "Screens", exact: true }).click();
  await page
    .getByRole("button", { name: "Hide screens", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Hide screens", exact: true }).click();
  await page.setViewportSize({ width: 1600, height: 1100 });
  p.device = "feature-graphic";
  p.appIcon = imagePath;
  p.slidesByDevice["feature-graphic"] = [
    {
      id: "feature",
      layout: "feature-graphic",
      label: {},
      headline: { en: "Your classes" },
      screenshot: "",
      elements: [
        {
          ...shape,
          id: "feature-shape",
          transform: { x: 50, y: 410, width: 100, height: 40, zIndex: 10 },
        },
      ],
    },
  ];
  await put(p);
  assert.equal(
    await page.locator('main [data-canvas-element="feature-shape"]').count(),
    1,
  );
  const featureDownload = page.waitForEvent("download", { timeout: 120000 });
  await page
    .getByRole("button", { name: "Export bundle", exact: true })
    .click();
  const featureZip = await JSZip.loadAsync(
    await readFile(await (await featureDownload).path()),
  );
  const featureFile = Object.values(featureZip.files).find(
    (f) => f.name.endsWith(".png") && !f.name.startsWith("review/"),
  );
  assert.ok(featureFile);
  const featurePixels = await sharp(await featureFile.async("nodebuffer"))
    .extract({ left: 60, top: 420, width: 1, height: 1 })
    .raw()
    .toBuffer();
  assert.deepEqual([...featurePixels.subarray(0, 3)], [187, 80, 60]);
  assert.deepEqual(errors, []);
  console.log(
    "Elements browser checks passed: nine types, upload/reuse, crop, undo/redo, lock/hide, groups, saved reuse, copying, reload, four iPhone PNGs and one feature graphic, group drag and keyboard nudge, exact shape pixels, missing translations/images blocked, narrow viewport, no page errors.",
  );
} catch (error) {
  await page?.screenshot({ path: path.join(resultDir, "failure.png") });
  await writeFile(
    path.join(resultDir, "failure-state.json"),
    await readFile(path.join(directory, "app-store-screenshots.json")),
  );
  throw error;
} finally {
  await browser?.close();
  if (child.exitCode === null) {
    const stopped = new Promise((r) => child.once("exit", r));
    if (process.platform === "win32")
      await promisify(execFile)("taskkill", [
        "/PID",
        String(child.pid),
        "/T",
        "/F",
      ]);
    else child.kill("SIGTERM");
    await stopped;
  }
  await rm(directory, { recursive: true, force: true });
}
