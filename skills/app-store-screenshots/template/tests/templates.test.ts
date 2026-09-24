import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PROJECT } from "../src/lib/defaults";
import { CANVAS } from "../src/lib/constants";
import { projectSchema } from "../src/lib/project-schema";
import { reviewExport } from "../src/lib/export-review";
import { artworkRects, mediaTemplateRects, slideImagePaths } from "../src/lib/template-layout";

function project(layout: "creator" | "content-library") {
  const state = structuredClone(DEFAULT_PROJECT);
  state.appName = "Template test";
  const slide = state.slidesByDevice.iphone[0];
  slide.layout = layout;
  slide.headline = { en: "Browse your classes" };
  slide.screenshot = "/screenshots/{locale}/app.png";
  return { state, slide };
}

test("creator photo stays separate from the app screen and is required for export", () => {
  const { state, slide } = project("creator");
  assert.ok(reviewExport(state).some((i) => i.message.includes("creator photo")));
  slide.photo = { src: "/screenshots/creator.png", crop: { x: 75, y: 30, zoom: 1.5 } };
  assert.deepEqual(reviewExport(state), []);
  const saved = projectSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(saved.slidesByDevice.iphone[0].photo, slide.photo);
  assert.equal(saved.slidesByDevice.iphone[0].screenshot, slide.screenshot);
  assert.ok(reviewExport(state, (p) => p.endsWith("creator.png")).some((i) => i.message.includes("could not load")));
});

test("library export requires two to four actual image paths in every language", () => {
  const { state, slide } = project("content-library");
  assert.ok(reviewExport(state).some((i) => i.message.includes("two to four")));
  slide.artworks = [{ src: "/screenshots/{locale}/one.png" }, { src: "" }];
  assert.ok(reviewExport(state).some((i) => i.message.includes("catalog image 2")));
  slide.artworks[1].src = "/screenshots/{locale}/two.png";
  state.locales = ["en", "de"];
  slide.headline.de = "Deine Kurse entdecken";
  assert.deepEqual(reviewExport(state), []);
  const issues = reviewExport(state, (p) => p === "/screenshots/de/two.png");
  assert.equal(issues.length, 1);
  assert.equal(issues[0].locale, "de");
  assert.match(issues[0].message, /catalog image 2/);
});

test("new assets reject external sources and invalid crop coordinates", () => {
  const { state, slide } = project("creator");
  for (const src of ["https://external.example/photo.png", "//external.example/photo.png", "javascript:alert(1)"]) {
    slide.photo = { src };
    assert.equal(projectSchema.safeParse(state).success, false);
  }
  for (const crop of [{ x: -1, y: 50, zoom: 1 }, { x: 50, y: 101, zoom: 1 }, { x: 50, y: 50, zoom: 0.5 }, { x: 50, y: 50, zoom: 4 }]) {
    slide.photo = { src: "/photo.jpg", crop };
    assert.equal(projectSchema.safeParse(state).success, false);
  }
  slide.photo = { src: "/photo.jpg" };
  slide.artworks = Array.from({ length: 5 }, () => ({ src: "/image.jpg" }));
  assert.equal(projectSchema.safeParse(state).success, false);
});

test("asset preload collection includes photos and all catalog images", () => {
  const { slide } = project("content-library");
  slide.photo = { src: "/photo.png" };
  slide.artworks = [{ src: "/one.png" }, { src: "/{locale}/two.png" }];
  assert.deepEqual(slideImagePaths(slide), [slide.screenshot, "/photo.png", "/one.png", "/{locale}/two.png"]);
});

test("media layouts preserve device proportions and keep all regions inside each canvas", () => {
  for (const [device, canvas] of Object.entries(CANVAS)) {
    if (device === "feature-graphic") continue;
    const sizes = [{ w: canvas.w, h: canvas.h }, ...(canvas.wL && canvas.hL ? [{ w: canvas.wL, h: canvas.hL }] : [])];
    for (const { w, h } of sizes) {
      const aspect = w > h ? 1.6 : device === "ipad" ? 0.77 : device.includes("android-") ? 0.625 : 0.49;
      const { caption, media, device: frame } = mediaTemplateRects(w, h, aspect);
      assert.ok(Math.abs(frame.width / frame.height - aspect) < 0.00001);
      assert.ok(caption.y + caption.height < media.y);
      assert.ok(caption.y + caption.height < frame.y);
      assert.ok(media.x + media.width < frame.x);
      for (const count of [2, 3, 4]) {
        const images = artworkRects(media, count);
        for (const rect of [caption, frame, media, ...images]) {
          assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0);
          assert.ok(rect.x + rect.width <= w + 0.01 && rect.y + rect.height <= h + 0.01);
        }
        for (let i = 1; i < images.length; i++) assert.ok(images[i - 1].y + images[i - 1].height < images[i].y);
      }
    }
  }
});

test("creator portrait gives the photo space while keeping the headline clear", () => {
  for (const { w, h } of [CANVAS.iphone, CANVAS.ipad, CANVAS.android]) {
    const { caption, media, device } = mediaTemplateRects(w, h, 0.49, "creator");
    assert.ok(media.width >= w * 0.8);
    assert.ok(media.y > caption.y + caption.height);
    assert.ok(device.y > caption.y + caption.height);
    assert.ok(device.y + device.height <= h);
    assert.ok(Math.abs(device.width / device.height - 0.49) < 0.00001);
  }
});
