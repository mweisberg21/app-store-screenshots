export type Device =
  | "iphone"
  | "ipad"
  | "android"
  | "android-7"
  | "android-10"
  | "feature-graphic";

export type Orientation = "portrait" | "landscape";

export type Platform = "ios" | "android";

// Choose the layout that makes the screenshot easiest to understand.
export type SlideLayout =
  | "hero"             // centered device, headline above
  | "device-bottom"    // headline top, device bottom-center
  | "creator"          // creator photo beside a real app screen
  | "content-library"  // approved catalog artwork beside a real app screen
  | "device-top"       // device top, headline bottom (contrast)
  | "two-devices"      // back + front phones, headline above
  | "no-device"        // standalone headline, no device
  | "split-landscape"  // landscape tablets only: caption left + device right
  | "feature-graphic"; // 1024×500 banner with icon + name + tagline

// Per-element rect in canvas pixel space. Optional rotation in degrees and zIndex.
export type ElementTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
};

export type BuiltInElementId = "caption" | "device" | "deviceSecondary";
export type TextElementId = `text:${string}`;
export type ElementId = BuiltInElementId | TextElementId;

export type SelectedElement = {
  slideId: string;
  elementId: ElementId;
};

// Per-locale text keyed by locale code (e.g. "en", "de"). A locale is absent
// if the user hasn't typed anything for it; renderers fall back to en (see
// lib/locale.ts). The set of locales a project targets lives on
// ProjectState.locales.
export type LocalizedText = Partial<Record<string, string>>;

export type TextElement = {
  id: string;
  text: LocalizedText;
  transform: ElementTransform;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
};

// Percent positions inside an image frame. Zoom never reveals empty edges.
export type ImageCrop = { x: number; y: number; zoom: number };
export type ImageAsset = { src: string; crop?: ImageCrop };

export type GradientBackground = {
  kind: "gradient"; textColor?: string;
  style: "linear" | "radial"; angle: number; center: { x: number; y: number };
  stops: { color: string; position: number }[];
};
export type Background =
  | { kind: "solid"; color: string; textColor?: string }
  | GradientBackground
  | { kind: "image"; image: ImageAsset; fit: "cover" | "contain"; color: string; tint: { color: string; opacity: number }; textColor?: string };

export type Slide = {
  id: string;
  layout: SlideLayout;
  label: LocalizedText;       // tiny uppercase caption above headline, per locale
  headline: LocalizedText;    // multi-line; newlines are intentional, per locale
  screenshot: string;         // path under /screenshots/ — may contain {locale}
  screenshotSecondary?: string; // for two-devices layout — may contain {locale}
  photo?: ImageAsset;
  artworks?: ImageAsset[];
  background?: Background;
  inverted?: boolean;         // dark background variant
  // Per-element overrides; when present, replaces layout default placement.
  transforms?: Partial<Record<BuiltInElementId, ElementTransform>>;
  textElements?: TextElement[];
};

export type ThemeId =
  | "brand-neutral"
  | "clean-light"
  | "dark-bold"
  | "warm-editorial"
  | "ocean-fresh"
  | "bloom-roast";

export type Theme = {
  id: string;
  name: string;
  bg: string;          // primary background
  bgAlt: string;       // inverted background
  fg: string;          // text on bg
  fgAlt: string;       // text on bgAlt
  accent: string;
  muted: string;
  fontFamily?: string;
  textAlign?: "left" | "center";
  background?: Background;
};

export type BrandStyle = {
  background: string;
  foreground: string;
  font: "sans" | "serif" | "humanist";
  alignment: "left" | "center";
};

export type ProjectState = {
  schemaVersion?: number;
  appName: string;
  themeId: string;
  brand?: BrandStyle;
  background?: Background;
  // v1 projects render as isolated screens until the user opts into connected crops.
  connectedCanvas: boolean;
  // Locales this project targets. Drives the toolbar dropdown and bulk export.
  // Single-locale projects ship as ["en"] and hide the locale UI.
  locales: string[];
  locale: string;
  device: Device;
  orientation: Orientation;
  // Per-device slide decks so platform switching preserves work
  slidesByDevice: Record<Device, Slide[]>;
  appIcon?: string;    // path under /public (e.g. /app-icon.png)
};
