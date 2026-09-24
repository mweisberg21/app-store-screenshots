import type { ExportIssue } from "./export-review";
import type { Slide } from "./types";

// Uses unscaled layout sizes, so editor zoom and rotated text do not distort
// the comparison. The renderer marks the text region and its actual contents.
export function reviewTextFit(root: HTMLElement, locale: string, slides: Slide[]): ExportIssue[] {
  const badSlides = new Set<string>();
  for (const box of root.querySelectorAll<HTMLElement>("[data-text-box]")) {
    const content = box.querySelector<HTMLElement>("[data-text-content]");
    if (!content) continue;
    const style = getComputedStyle(box);
    const availableHeight = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const availableWidth = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const overflows = content.scrollHeight > availableHeight + 2 || content.scrollWidth > availableWidth + 2 ||
      [...content.querySelectorAll<HTMLElement>("[data-text-leaf]")].some((leaf) => leaf.scrollWidth > availableWidth + 2);
    if (overflows && box.dataset.slideId) badSlides.add(box.dataset.slideId);
  }
  return slides.flatMap((slide, index) => badSlides.has(slide.id) ? [{
    slideId: slide.id, locale,
    message: `Screen ${index + 1} · ${locale.toUpperCase()}: text exceeds its frame. Shorten the text or enlarge the text frame.`,
  }] : []);
}
