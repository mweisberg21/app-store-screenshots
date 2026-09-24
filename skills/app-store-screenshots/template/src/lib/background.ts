import { contrastRatio } from "./brand";
import type { Background, GradientBackground, ProjectState, Slide, Theme } from "./types";

export function effectiveBackground(slide: Slide, theme: Theme): Background {
  return slide.background ?? theme.background ?? { kind: "solid", color: slide.inverted ? theme.bgAlt : theme.bg };
}

export function backgroundText(slide: Slide, theme: Theme): string {
  return effectiveBackground(slide, theme).textColor ?? (slide.inverted ? theme.fgAlt : theme.fg);
}

export function themeForSlide(slide: Slide, theme: Theme): Theme {
  const text = backgroundText(slide, theme);
  return { ...theme, fg: text, fgAlt: text };
}

export function gradientCss(background: GradientBackground): string {
  const stops = [...background.stops].sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`).join(", ");
  return background.style === "radial"
    ? `radial-gradient(ellipse at ${background.center.x}% ${background.center.y}%, ${stops})`
    : `linear-gradient(${background.angle}deg, ${stops})`;
}

export function mixColor(a: string, b: string, fraction: number): string {
  return "#" + [1, 3, 5].map(offset => Math.round(parseInt(a.slice(offset, offset + 2), 16) * (1 - fraction) + parseInt(b.slice(offset, offset + 2), 16) * fraction).toString(16).padStart(2, "0")).join("");
}

// Sample the complete gradient. Image readability requires a visual review;
// a single base color cannot represent the photograph behind the text.
export function backgroundContrast(background: Background, text: string): number | null {
  if (background.kind === "image") return null;
  if (background.kind === "solid") return contrastRatio(background.color, text);
  const stops = [...background.stops].sort((a, b) => a.position - b.position);
  let lowest = 21;
  for (let i = 1; i < stops.length; i++) {
    const samples = stops[i - 1].position === stops[i].position ? 1 : 100;
    for (let step = 0; step <= samples; step++) lowest = Math.min(lowest, contrastRatio(mixColor(stops[i - 1].color, stops[i].color, step / samples), text));
  }
  return lowest;
}

export function applyBackground(state: ProjectState, scope: "project" | "slide", slideId: string, background: Background | undefined, replaceOverrides = false): ProjectState {
  if (scope === "slide") return { ...state, slidesByDevice: { ...state.slidesByDevice,
    [state.device]: state.slidesByDevice[state.device].map(slide => slide.id === slideId ? { ...slide, background } : slide),
  } };
  return { ...state, background, ...(replaceOverrides ? { slidesByDevice: Object.fromEntries(Object.entries(state.slidesByDevice).map(([device, slides]) => [device, slides.map(slide => ({ ...slide, background: undefined }))])) as ProjectState["slidesByDevice"] } : {}) };
}

export const GRADIENT_PRESETS: { name: string; colors: string[]; text: string }[] = [
  { name: "Warm neutral", colors: ["#FAF6EF", "#E2D4C2"], text: "#302B25" },
  { name: "Ocean", colors: ["#DDEFF0", "#9CC9CF", "#73ACBD"], text: "#153A43" },
  { name: "Forest", colors: ["#172E29", "#38554A"], text: "#F7F5ED" },
  { name: "Rose", colors: ["#F8EDE7", "#DFB6AD"], text: "#492E2D" },
];
