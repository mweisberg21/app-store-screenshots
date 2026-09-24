import type { ImageCrop, Slide } from "./types";

export const DEFAULT_CROP: ImageCrop = { x: 50, y: 50, zoom: 1 };
export type TemplateRect = { x: number; y: number; width: number; height: number };

// The headline stays clear of all images. A creator photo can sit behind the
// lower device; catalog images sit beside it. Crops keep image proportions.
export function mediaTemplateRects(cW: number, cH: number, frameAspect: number, layout: "creator" | "content-library" = "content-library") {
  const landscape = cW > cH;
  if (layout === "creator" && !landscape) {
    const width = Math.min(cW * 0.52, cH * 0.55 * frameAspect);
    const height = width / frameAspect;
    return {
      caption: { x: cW * 0.08, y: cH * 0.06, width: cW * 0.84, height: cH * 0.22 },
      media: { x: cW * 0.08, y: cH * 0.31, width: cW * 0.84, height: cH * 0.46 },
      device: { x: cW * 0.94 - width, y: cH * 0.95 - height, width, height },
    };
  }
  const top = cH * (landscape ? 0.40 : 0.32);
  const bottom = cH * 0.93;
  const regionH = bottom - top;
  const deviceW = Math.min(cW * 0.46, regionH * frameAspect);
  const deviceH = deviceW / frameAspect;
  return {
    caption: { x: cW * 0.08, y: cH * 0.06, width: cW * 0.84, height: cH * (landscape ? 0.30 : 0.22) },
    media: { x: cW * 0.08, y: top, width: cW * 0.36, height: regionH },
    device: { x: cW * 0.48 + (cW * 0.46 - deviceW) / 2, y: top + (regionH - deviceH) / 2, width: deviceW, height: deviceH },
  };
}

export function artworkRects(region: TemplateRect, count: number): TemplateRect[] {
  const total = Math.max(2, Math.min(4, count));
  const gap = region.width * 0.05;
  // Keep catalog images near 4:3. Do not stretch two images to fill a tall strip.
  const height = Math.min(region.width * 0.75, (region.height - gap * (total - 1)) / total);
  const groupHeight = height * total + gap * (total - 1);
  return Array.from({ length: total }, (_, i) => ({
    x: region.x, y: region.y + (region.height - groupHeight) / 2 + i * (height + gap), width: region.width, height,
  }));
}

export function slideImagePaths(slide: Slide): string[] {
  return [slide.screenshot, slide.screenshotSecondary, slide.photo?.src, ...(slide.artworks || []).map((art) => art.src)]
    .filter((path): path is string => !!path);
}
