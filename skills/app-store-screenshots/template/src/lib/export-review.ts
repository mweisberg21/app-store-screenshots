import { contrastRatio, projectTheme } from "./brand";
import { resolveScreenshot } from "./locale";
import type { ProjectState } from "./types";

export type ExportIssue = { message: string; slideId?: string; locale?: string };

// Preview may use fallback copy. A final export must have the requested language.
// This is a completeness check, not a replacement for visual or customer review.
export function reviewExport(state: ProjectState, imageFailed: (path: string) => boolean = () => false): ExportIssue[] {
  const issues: ExportIssue[] = [];
  const slides = state.slidesByDevice[state.device] || [];
  if (!state.appName.trim()) issues.push({ message: "Add the customer app name." });
  if (!slides.length) issues.push({ message: "Add a screen." });
  if (state.device === "iphone" && imageFailed("/mockup.png")) {
    issues.push({ message: "The iPhone frame could not load. Restore the frame file." });
  }
  const theme = projectTheme(state);
  for (const [index, slide] of slides.entries()) {
    const base = { slideId: slide.id };
    const bg = slide.inverted ? theme.bgAlt : theme.bg;
    const fg = slide.inverted ? theme.fgAlt : theme.fg;
    if (contrastRatio(bg, fg) < 4.5) {
      issues.push({ ...base, message: `Screen ${index + 1}: increase headline contrast in Brand settings (target 4.5:1).` });
    }
    for (const locale of state.locales) {
      const prefix = `Screen ${index + 1} · ${locale.toUpperCase()}`;
      const add = (message: string) => issues.push({ ...base, locale, message: `${prefix}: ${message}` });
      if (!slide.headline[locale]?.trim()) add("add the headline in this language.");
      if (Object.values(slide.label).some((value) => value?.trim()) && !slide.label[locale]?.trim()) {
        add("translate the label or remove it from every language.");
      }
      for (const element of slide.textElements || []) {
        if (!element.text[locale]?.trim()) add("add the extra text in this language or remove the empty text element.");
      }
      const feature = state.device === "feature-graphic" || slide.layout === "feature-graphic";
      const paths: [string, string | undefined][] = feature
        ? [["app icon", state.appIcon]]
        : slide.layout === "no-device" ? [] : [["screenshot", slide.screenshot]];
      if (!feature && slide.layout === "two-devices") paths.push(["back screenshot", slide.screenshotSecondary]);
      if (!feature && slide.layout === "creator") paths.push(["creator photo", slide.photo?.src]);
      if (!feature && slide.layout === "content-library") {
        const artworks = slide.artworks || [];
        if (artworks.length < 2 || artworks.length > 4) add("use two to four catalog images.");
        for (const [i, art] of artworks.entries()) paths.push([`catalog image ${i + 1}`, art.src]);
      }
      for (const [label, raw] of paths) {
        if (!raw) add(`add the ${label}.`);
        else if (imageFailed(resolveScreenshot(raw, locale))) add(`the ${label} could not load. Replace it or check its path.`);
      }
    }
  }
  return issues;
}
