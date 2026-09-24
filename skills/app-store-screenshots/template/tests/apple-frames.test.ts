import assert from "node:assert/strict";
import { test } from "node:test";
import { appleFrame, fitFrameRect, framePath } from "../src/lib/apple-frames";
import { DEFAULT_PROJECT } from "../src/lib/defaults";
import { reviewExport } from "../src/lib/export-review";

function complete() {
  const state = structuredClone(DEFAULT_PROJECT);
  state.appName = "Frame test";
  state.slidesByDevice.iphone[0].headline = { en: "Browse your classes" };
  state.slidesByDevice.iphone[0].screenshot = "/screenshots/{locale}/app.png";
  return state;
}

test("Apple frame selection uses the matching aperture for each orientation", () => {
  assert.equal(appleFrame("iphone", "portrait")?.screen.width, 1320);
  assert.equal(appleFrame("ipad", "portrait")?.screen.width, 2064);
  assert.equal(appleFrame("ipad", "landscape")?.screen.width, 2752);
  assert.equal(appleFrame("ipad", "landscape")?.screen.height, 2064);
  assert.equal(appleFrame("android", "portrait"), undefined);
});

test("a missing Apple bezel blocks export only when a slide uses a device", () => {
  const state = complete();
  const failed = (path: string) => path === framePath(appleFrame("iphone", "portrait")!);
  assert.match(reviewExport(state, failed)[0].message, /iPhone 17 Pro Max/);
  state.slidesByDevice.iphone[0].layout = "no-device";
  assert.deepEqual(reviewExport(state, failed), []);
});

test("Apple captures must match the aperture proportions in each language and device", () => {
  const state = complete();
  state.locales = ["en", "de"];
  state.slidesByDevice.iphone[0].headline.de = "Deine Kurse";
  const wrongLanguage = reviewExport(state, undefined, path => path.includes("/de/") ? { width: 2064, height: 2752 } : { width: 1320, height: 2868 });
  assert.equal(wrongLanguage.length, 1);
  assert.equal(wrongLanguage[0].locale, "de");
  assert.match(wrongLanguage[0].message, /1320 × 2868 proportions/);
  assert.deepEqual(reviewExport(state, undefined, () => ({ width: 660, height: 1434 })), []);
  state.device = "ipad";
  state.orientation = "landscape";
  state.slidesByDevice.ipad = structuredClone(state.slidesByDevice.iphone);
  assert.equal(reviewExport(state, undefined, () => ({ width: 1320, height: 2868 })).length, 2);
  assert.deepEqual(reviewExport(state, undefined, () => ({ width: 2752, height: 2064 })), []);
});

test("legacy transform boxes preserve frame proportions, center, and bounds", () => {
  for (const rect of [{ x: 30, y: 90, width: 900, height: 1500 }, { x: 10, y: 20, width: 300, height: 1100 }]) {
    for (const aspect of [1470 / 3000, 2300 / 3000, 3000 / 2300]) {
      const fit = fitFrameRect(rect, aspect);
      assert.ok(Math.abs(fit.width / fit.height - aspect) < 0.00001);
      assert.equal(fit.x + fit.width / 2, rect.x + rect.width / 2);
      assert.equal(fit.y + fit.height / 2, rect.y + rect.height / 2);
      assert.ok(fit.width <= rect.width && fit.height <= rect.height + 0.00001);
    }
  }
});
