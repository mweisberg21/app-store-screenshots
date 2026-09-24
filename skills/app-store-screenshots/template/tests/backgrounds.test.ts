import assert from "node:assert/strict";
import { test } from "node:test";
import { applyBackground, backgroundContrast, backgroundText, effectiveBackground, gradientCss, themeForSlide } from "../src/lib/background";
import { projectTheme } from "../src/lib/brand";
import { DEFAULT_PROJECT } from "../src/lib/defaults";
import { reviewExport } from "../src/lib/export-review";
import { backgroundSchema, projectSchema } from "../src/lib/project-schema";
import { slideImagePaths } from "../src/lib/template-layout";
import type { Background, GradientBackground } from "../src/lib/types";

const gradient: GradientBackground = { kind: "gradient", style: "linear", angle: 90, center: { x: 50, y: 50 }, stops: [{ color: "#FFFFFF", position: 0 }, { color: "#CCCCCC", position: 100 }], textColor: "#202020" };
const picture: Background = { kind: "image", image: { src: "/screenshots/{locale}/background.png", crop: { x: 20, y: 80, zoom: 1.6 } }, fit: "cover", color: "#FFFFFF", tint: { color: "#000000", opacity: 25 }, textColor: "#FFFFFF" };

function complete() {
  const state = structuredClone(DEFAULT_PROJECT);
  state.appName = "Background test";
  const slide = state.slidesByDevice.iphone[0];
  slide.headline = { en: "Your classes" };
  slide.screenshot = "/app.png";
  return { state, slide };
}

test("old projects keep their brand background and inverted colors", () => {
  const { state, slide } = complete();
  const theme = projectTheme(state);
  assert.deepEqual(effectiveBackground(slide, theme), { kind: "solid", color: theme.bg });
  slide.inverted = true;
  assert.equal(backgroundText(slide, theme), theme.fgAlt);
  assert.deepEqual(effectiveBackground(slide, theme), { kind: "solid", color: theme.bgAlt });
});

test("project defaults, screen overrides, text color, and reset have explicit precedence", () => {
  const { state, slide } = complete();
  let saved = applyBackground(state, "project", slide.id, gradient);
  assert.deepEqual(effectiveBackground(slide, projectTheme(saved)), gradient);
  saved = applyBackground(saved, "slide", slide.id, picture);
  let current = saved.slidesByDevice.iphone[0];
  assert.deepEqual(effectiveBackground(current, projectTheme(saved)), picture);
  assert.equal(themeForSlide(current, projectTheme(saved)).fg, "#FFFFFF");
  saved = applyBackground(saved, "project", slide.id, { kind: "solid", color: "#DDDDDD" });
  assert.deepEqual(saved.slidesByDevice.iphone[0].background, picture);
  saved = applyBackground(saved, "slide", slide.id, undefined);
  current = saved.slidesByDevice.iphone[0];
  assert.deepEqual(effectiveBackground(current, projectTheme(saved)), saved.background);
  saved.slidesByDevice.ipad[0].background = picture;
  saved = applyBackground(saved, "project", slide.id, gradient, true);
  assert.ok(Object.values(saved.slidesByDevice).flat().every(item => !item.background));
  assert.equal(state.background, undefined, "updates must not mutate the source state");
});

test("all background types survive a validated project save", () => {
  for (const background of [{ kind: "solid", color: "#C4D0C0" }, gradient, picture]) {
    const { state, slide } = complete();
    const parsed = projectSchema.parse({ ...state, background, slidesByDevice: { ...state.slidesByDevice, iphone: [{ ...slide, background }] } });
    assert.deepEqual(parsed.background, background);
    assert.deepEqual(parsed.slidesByDevice.iphone[0].background, background);
  }
});

test("background validation rejects remote images, CSS payloads, and unbounded controls", () => {
  for (const background of [
    { kind: "solid", color: "url(https://example.com)" },
    { ...gradient, angle: 361 }, { ...gradient, center: { x: -1, y: 50 } },
    { ...gradient, stops: [{ color: "#FFFFFF", position: 0 }] },
    { ...gradient, stops: Array.from({ length: 6 }, () => gradient.stops[0]) },
    { ...gradient, stops: [{ color: "red", position: 0 }, gradient.stops[1]] },
    { ...picture, image: { src: "https://example.com/image.png" } },
    { ...picture, tint: { color: "#000000", opacity: 101 } },
    { ...picture, image: { src: "/image.png", crop: { x: 50, y: 50, zoom: 8 } } },
  ]) assert.equal(backgroundSchema.safeParse(background).success, false);
});

test("gradient output sorts stops without changing state and checks intermediate colors", () => {
  const reversed = { ...gradient, stops: [...gradient.stops].reverse() };
  assert.equal(gradientCss(reversed), "linear-gradient(90deg, #FFFFFF 0%, #CCCCCC 100%)");
  assert.equal(reversed.stops[0].position, 100);
  assert.equal(gradientCss({ ...gradient, style: "radial", center: { x: 25, y: 70 } }), "radial-gradient(ellipse at 25% 70%, #FFFFFF 0%, #CCCCCC 100%)");
  assert.ok(backgroundContrast(gradient, "#202020")! >= 4.5);
  const middle = { ...gradient, stops: [{ color: "#000000", position: 0 }, { color: "#FFFFFF", position: 100 }] };
  assert.ok(backgroundContrast(middle, "#757575")! < 1.1);
  assert.ok(backgroundContrast({ ...middle, stops: middle.stops.map(stop => ({ ...stop, position: 50 })) }, "#757575")! >= 4.5);
  assert.equal(backgroundContrast(picture, "#FFFFFF"), null);
});

test("export checks the actual background and each localized image, including text-only slides", () => {
  const { state, slide } = complete();
  state.background = { kind: "solid", color: "#FFFFFF", textColor: "#FFFFFF" };
  assert.ok(reviewExport(state).some(issue => issue.message.includes("contrast")));
  slide.background = picture;
  slide.layout = "no-device";
  slide.screenshot = "";
  state.locales.push("de"); slide.headline.de = "Deine Kurse";
  assert.ok(slideImagePaths(slide).includes(picture.image.src));
  const issues = reviewExport(state, path => path === "/screenshots/de/background.png");
  assert.equal(issues.length, 1);
  assert.match(issues[0].message, /DE: the background image could not load/);
  slide.background = { ...picture, image: { src: "" } };
  assert.equal(reviewExport(state).filter(issue => issue.message.includes("add the background image")).length, 2);
});
