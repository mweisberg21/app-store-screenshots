import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PROJECT } from "../src/lib/defaults";
import { projectSchema } from "../src/lib/project-schema";
import {
  ELEMENT_KINDS,
  createElement,
  cloneElements,
  moveElement,
  arrangeElements,
  saveGroup,
  placeGroup,
  elementPaths,
  projectAssets,
  copyToSlides,
} from "../src/lib/canvas-elements";
import { snapPosition } from "../src/lib/element-snapping";
import { reviewExport } from "../src/lib/export-review";
import { slideImagePaths } from "../src/lib/template-layout";
function project() {
  const p = structuredClone(DEFAULT_PROJECT);
  p.appName = "Elements test";
  p.slidesByDevice.iphone = [
    {
      id: "screen",
      layout: "no-device",
      headline: { en: "A useful message" },
      label: {},
      screenshot: "",
      elements: [],
    },
  ];
  return p;
}

test("all element kinds, assets, and saved groups survive project validation", () => {
  const p = project(),
    slide = p.slidesByDevice.iphone[0];
  slide.elements = ELEMENT_KINDS.map((k) => createElement(k, 1320, 2868));
  p.assets = [
    {
      id: "logo",
      name: "Brand logo",
      category: "logo",
      src: "/screenshots/logo.png",
    },
  ];
  p.savedGroups = [saveGroup("Reusable", slide.elements)];
  assert.deepEqual(projectSchema.parse(p), p);
});
test("elements reject remote assets, injected styles, unbounded counts, duplicate IDs, and unknown icons", () => {
  const p = project(),
    slide = p.slidesByDevice.iphone[0];
  const image = createElement("image", 1320, 2868);
  assert.ok(image.kind === "image");
  for (const src of [
    "https://example.com/image.png",
    "//example.com/a.png",
    "javascript:alert(1)",
  ]) {
    slide.elements = [{ ...image, asset: { src } }];
    assert.equal(projectSchema.safeParse(p).success, false);
  }
  const shape = createElement("shape", 1320, 2868);
  assert.ok(shape.kind === "shape");
  slide.elements = [{ ...shape, fill: "url(https://example.com)" }];
  assert.equal(projectSchema.safeParse(p).success, false);
  slide.elements = Array.from({ length: 51 }, () =>
    createElement("text", 1320, 2868),
  );
  assert.equal(projectSchema.safeParse(p).success, false);
  slide.elements = [shape, shape];
  assert.equal(projectSchema.safeParse(p).success, false);
  const icon = createElement("icon", 1320, 2868);
  assert.ok(icon.kind === "icon");
  assert.equal(
    projectSchema.safeParse({
      ...p,
      slidesByDevice: {
        ...p.slidesByDevice,
        iphone: [{ ...slide, elements: [{ ...icon, icon: "unknown" }] }],
      },
    }).success,
    false,
  );
});
test("moving a group preserves offsets and any locked member prevents movement", () => {
  const a = createElement("image", 1320, 2868),
    b = createElement("text", 1320, 2868);
  a.groupId = b.groupId = "g";
  b.transform.x = 10;
  b.transform.y = 20;
  const moved = moveElement([a, b], a.id, {
    ...a.transform,
    x: a.transform.x + 90,
    y: a.transform.y - 30,
  });
  assert.equal(moved[1].transform.x, 100);
  assert.equal(moved[1].transform.y, -10);
  assert.equal(b.transform.x, 10);
  b.locked = true;
  assert.deepEqual(moveElement([a, b], a.id, { ...a.transform, x: 0 }), [a, b]);
});
test("duplicate and cross-screen copies have independent IDs and group membership", () => {
  const a = createElement("shape", 1320, 2868),
    b = createElement("text", 1320, 2868);
  a.groupId = b.groupId = "g";
  const copies = cloneElements([a, b]);
  assert.notEqual(copies[0].id, a.id);
  assert.notEqual(copies[0].groupId, a.groupId);
  assert.equal(copies[0].groupId, copies[1].groupId);
  assert.equal(copies[0].transform.x, a.transform.x + 32);
  const p = project(),
    src = p.slidesByDevice.iphone[0];
  const dest = { ...src, id: "other" };
  const slides = copyToSlides([src, dest], src.id, ["other"], [a, b]);
  assert.equal(slides[1].elements?.length, 2);
  assert.equal(slides[0], src);
  assert.equal(slides[1].elements?.[0].transform.x, a.transform.x);
});
test("group alignment treats members as one unit and spacing uses element edges", () => {
  const a = createElement("shape", 1000, 2000),
    b = createElement("text", 1000, 2000);
  a.groupId = b.groupId = "g";
  a.transform = { x: 100, y: 100, width: 100, height: 100 };
  b.transform = { x: 230, y: 250, width: 200, height: 50 };
  const centered = arrangeElements([a, b], [a.id], "center", 1000, 2000);
  assert.equal(centered[1].transform.x - centered[0].transform.x, 130);
  assert.equal(centered[0].transform.x, 335);
  const items = [0, 1, 2].map((_, i) => ({
    ...createElement("shape", 1000, 2000),
    transform: {
      x: [0, 120, 500][i],
      y: 0,
      width: [100, 50, 200][i],
      height: 100,
    },
  }));
  const spaced = arrangeElements(
    items,
    items.map((e) => e.id),
    "space-x",
    1000,
    2000,
  );
  assert.equal(spaced[1].transform.x, 275);
  assert.equal(spaced[2].transform.x, 500);
});
test("saved groups can be placed on a smaller canvas without shared references", () => {
  const a = createElement("shape", 1320, 2868),
    b = createElement("text", 1320, 2868);
  const group = saveGroup("Teacher", [a, b]),
    placed = placeGroup(group, 400, 800);
  assert.equal(placed.length, 2);
  assert.notEqual(placed[0].id, group.elements[0].id);
  assert.equal(placed[0].groupId, placed[1].groupId);
  assert.ok(placed.every((e) => e.transform.x >= 0 && e.transform.y >= 0));
  placed[0].transform.x = 100;
  assert.notEqual(group.elements[0].transform.x, 100);
});
test("new element assets preload, deduplicate in the library, and hidden assets do not block export", () => {
  const p = project(),
    slide = p.slidesByDevice.iphone[0];
  const image = createElement("image", 1320, 2868);
  assert.ok(image.kind === "image");
  image.asset.src = "/screenshots/photo.png";
  slide.elements = [image];
  p.assets = [
    { id: "photo", name: "Teacher", src: image.asset.src, category: "photo" },
  ];
  assert.equal(
    projectAssets(p).filter((a) => a.src === image.asset.src).length,
    1,
  );
  assert.ok(slideImagePaths(slide).includes(image.asset.src));
  assert.ok(
    reviewExport(p, () => true).some((i) => i.message.includes(image.name)),
  );
  image.hidden = true;
  assert.deepEqual(elementPaths(image), []);
  assert.equal(reviewExport(p, () => true).length, 0);
});
test("new text and card titles require each language; standalone devices validate their own frame", () => {
  const p = project(),
    slide = p.slidesByDevice.iphone[0];
  p.locales = ["en", "de"];
  slide.headline.de = "Eine Nachricht";
  const text = createElement("text", 1320, 2868);
  assert.ok(text.kind === "text");
  text.text.en = "Teacher";
  slide.elements = [text];
  assert.ok(
    reviewExport(p).some(
      (i) => i.locale === "de" && i.message.includes(text.name),
    ),
  );
  const cards = createElement("cards", 1320, 2868);
  assert.ok(cards.kind === "cards");
  cards.items.forEach((c, i) => {
    c.asset.src = "/cover.png";
    c.title = { en: `Class ${i}` };
  });
  slide.elements = [cards];
  assert.ok(
    reviewExport(p).some(
      (i) => i.locale === "de" && i.message.includes("translate card"),
    ),
  );
  const device = createElement("device", 1320, 2868);
  assert.ok(device.kind === "device");
  device.device = "ipad";
  device.src = "/ipad.png";
  slide.elements = [device];
  assert.ok(
    reviewExport(
      p,
      () => false,
      () => ({ width: 1320, height: 2868 }),
    ).some((i) => i.message.includes("2064 × 2752")),
  );
});
test("snap finds the nearest edge or center and leaves distant coordinates alone", () => {
  const rect = { x: 94, y: 123, width: 200, height: 100 };
  assert.deepEqual(snapPosition(rect, { x: [100], y: [1000] }, 8), {
    x: 100,
    y: 123,
    guides: { x: 100 },
  });
  assert.equal(snapPosition(rect, { x: [500], y: [] }, 8).x, 94);
});

test("assets used only by a saved group remain available in the library", () => {
  const p = project(),
    image = createElement("image", 1320, 2868);
  assert.ok(image.kind === "image");
  image.asset.src = "/screenshots/saved-photo.png";
  p.savedGroups = [saveGroup("Teacher", [image])];
  assert.ok(projectAssets(p).some((a) => a.src === image.asset.src));
});
test("saved groups preserve layer order and scale borders and card spacing", () => {
  const card = createElement("cards", 1320, 2868),
    shape = createElement("shape", 1320, 2868);
  assert.ok(card.kind === "cards" && shape.kind === "shape");
  card.transform.zIndex = 20;
  shape.transform.zIndex = 5;
  shape.strokeWidth = 12;
  const group = saveGroup("Test", [card, shape]),
    placed = placeGroup(group, 330, 700);
  assert.equal(placed[0].kind, "shape");
  assert.equal(placed[1].kind, "cards");
  assert.ok(placed[0].kind === "shape" && placed[0].strokeWidth < 12);
  assert.ok(placed[1].kind === "cards" && placed[1].gap < card.gap);
});
