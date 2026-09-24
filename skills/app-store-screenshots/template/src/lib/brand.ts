import { themeById } from "./constants";
import type { BrandStyle, ProjectState, Theme } from "./types";

// Local font stacks keep the editor usable without external font requests.
// For an exact customer font, add its licensed files and @font-face to the project.
export const BRAND_FONTS = {
  sans: { name: "System sans", family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  serif: { name: "Editorial serif", family: 'Georgia, "Times New Roman", serif' },
  humanist: { name: "Humanist sans", family: '"Trebuchet MS", Verdana, sans-serif' },
} as const;

export const DEFAULT_BRAND: BrandStyle = {
  background: "#FFFFFF", foreground: "#202020", font: "sans", alignment: "center",
};

export function brandForProject(state: Pick<ProjectState, "brand" | "themeId">): BrandStyle {
  if (state.brand) return state.brand;
  const theme = themeById(state.themeId);
  return { background: theme.bg, foreground: theme.fg, font: "sans", alignment: theme.textAlign ?? "center" };
}

export function projectTheme(state: Pick<ProjectState, "brand" | "themeId" | "background">): Theme {
  const theme = themeById(state.themeId);
  if (!state.brand) return { ...theme, background: state.background };
  const brand = state.brand;
  return {
    ...theme, name: "Customer brand", bg: brand.background, fg: brand.foreground,
    bgAlt: brand.foreground, fgAlt: brand.background, accent: brand.foreground,
    fontFamily: BRAND_FONTS[brand.font].family, textAlign: brand.alignment, background: state.background,
  };
}

export function contrastRatio(a: string, b: string): number {
  function luminance(hex: string) {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
    const channels = [0, 2, 4].map((offset) => {
      const n = parseInt(full.slice(offset, offset + 2), 16) / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
