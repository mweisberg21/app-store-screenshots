import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { DEFAULT_PROJECT } from "../src/lib/defaults";
import { DEFAULT_BRAND, contrastRatio, projectTheme } from "../src/lib/brand";
import { projectSchema } from "../src/lib/project-schema";
import { reviewExport } from "../src/lib/export-review";
import type { ProjectState } from "../src/lib/types";

function complete(): ProjectState {
  const state = structuredClone(DEFAULT_PROJECT);
  state.appName = "Test app";
  state.slidesByDevice.iphone[0].headline = { en: "Browse your classes" };
  state.slidesByDevice.iphone[0].screenshot = "/screenshots/{locale}/classes.png";
  return state;
}

test("first-run project and reset starter agree and contain no leftover demo transforms", () => {
  const firstRun = JSON.parse(readFileSync(new URL("../app-store-screenshots.json", import.meta.url), "utf8"));
  assert.deepEqual(firstRun, DEFAULT_PROJECT);
  assert.equal(projectSchema.safeParse(firstRun).success, true);
  assert.equal(firstRun.connectedCanvas, false);
  for (const slides of Object.values(DEFAULT_PROJECT.slidesByDevice)) {
    assert.equal(slides.length, 1);
    assert.equal(slides[0].transforms, undefined);
    assert.deepEqual(slides[0].headline, {});
  }
});

test("brand settings survive schema validation and drive the renderer", () => {
  const state = complete();
  state.brand = { ...DEFAULT_BRAND, background: "#F6EEE3", foreground: "#262D24", font: "serif", alignment: "center" };
  const saved = projectSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(saved.brand, state.brand);
  const theme = projectTheme(saved);
  assert.equal(theme.bg, state.brand.background);
  assert.equal(theme.fgAlt, state.brand.background);
  assert.equal(theme.textAlign, "center");
  assert.match(theme.fontFamily!, /Georgia/);
  assert.equal(projectTheme({ themeId: "warm-editorial" }).bg, "#F7E8DA");
});

test("brand fields reject CSS payloads, incomplete colors, and unknown font choices", () => {
  for (const patch of [{ background: "url(https://example.com)" }, { foreground: "#fff" }, { font: "unknown" }]) {
    assert.equal(projectSchema.safeParse({ ...complete(), brand: { ...DEFAULT_BRAND, ...patch } }).success, false);
  }
});

test("export rejects unfinished content but does not require unused device decks", () => {
  const missing = reviewExport(DEFAULT_PROJECT);
  assert.ok(missing.some((issue) => issue.message.includes("app name")));
  assert.ok(missing.some((issue) => issue.message.includes("headline")));
  assert.ok(missing.some((issue) => issue.message.includes("screenshot")));
  assert.deepEqual(reviewExport(complete()), []);
});

test("preview fallback is not accepted as a translated headline or label", () => {
  const state = complete();
  state.locales.push("de");
  const slide = state.slidesByDevice.iphone[0];
  slide.label = { en: "Classes" };
  const missing = reviewExport(state);
  assert.equal(missing.filter((issue) => issue.locale === "de").length, 2);
  slide.headline.de = "Deine Kurse entdecken";
  slide.label.de = "Kurse";
  assert.deepEqual(reviewExport(state), []);
});

test("export checks the requested image language, back image, and extra text", () => {
  const state = complete();
  state.locales = ["fr"];
  state.locale = "fr";
  const slide = state.slidesByDevice.iphone[0];
  slide.headline = { fr: "Vos cours" };
  slide.layout = "two-devices";
  slide.textElements = [{ id: "detail", text: { en: "Saved classes" }, transform: { x: 0, y: 0, width: 100, height: 100 } }];
  const issues = reviewExport(state, (path) => path === "/screenshots/fr/classes.png");
  assert.ok(issues.some((issue) => issue.message.includes("could not load")));
  assert.ok(issues.some((issue) => issue.message.includes("back screenshot")));
  assert.ok(issues.some((issue) => issue.message.includes("extra text")));
});

test("feature graphics require a real icon; intentional text-only slides need no device image", () => {
  const state = complete();
  state.slidesByDevice.iphone[0].layout = "no-device";
  state.slidesByDevice.iphone[0].screenshot = "";
  assert.deepEqual(reviewExport(state), []);
  state.device = "feature-graphic";
  state.slidesByDevice[state.device][0].headline = { en: "Your classes" };
  assert.ok(reviewExport(state).some((issue) => issue.message.includes("app icon")));
  state.appIcon = "/icon.png";
  assert.deepEqual(reviewExport(state), []);
});

test("contrast check uses the selected brand and inverted background", () => {
  assert.equal(contrastRatio("#FFFFFF", "#000000"), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  const state = complete();
  state.brand = { ...DEFAULT_BRAND, foreground: "#EEEEEE" };
  state.slidesByDevice.iphone[0].inverted = true;
  assert.ok(reviewExport(state).some((issue) => issue.message.includes("contrast")));
  state.brand.foreground = "#202020";
  assert.deepEqual(reviewExport(state), []);
});
