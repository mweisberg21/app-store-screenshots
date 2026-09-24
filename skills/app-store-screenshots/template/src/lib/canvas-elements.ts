import { nid } from "./defaults";
import { appleFrame, framePath } from "./apple-frames";
import type {
  CanvasElement,
  ElementKind,
  ElementTransform,
  ProjectAsset,
  ProjectState,
  SavedGroup,
  Slide,
} from "./types";

export const ELEMENT_KINDS = [
  "image",
  "logo",
  "device",
  "detail",
  "cards",
  "shape",
  "line",
  "icon",
  "text",
] as const;
export const ELEMENT_INFO: Record<
  ElementKind,
  { name: string; description: string }
> = {
  image: { name: "Image", description: "Photos and transparent artwork" },
  logo: { name: "Logo", description: "Keep the customer's mark intact" },
  device: { name: "Device", description: "A real frame and app capture" },
  detail: {
    name: "Screenshot detail",
    description: "Enlarge a useful part of the app",
  },
  cards: { name: "Content cards", description: "Covers with optional titles" },
  shape: { name: "Shape", description: "Color panels, circles, and borders" },
  line: {
    name: "Line or arrow",
    description: "Point to a feature or divide space",
  },
  icon: { name: "Icon", description: "Simple, consistent symbols" },
  text: { name: "Text", description: "A caption, label, or short message" },
};
export const ICON_NAMES = [
  "play",
  "calendar",
  "community",
  "heart",
  "book",
  "check",
  "cast",
  "clock",
] as const;
export const customId = (id: string): `element:${string}` => `element:${id}`;
export const customKey = (id: string | null | undefined) =>
  id?.startsWith("element:") ? id.slice(8) : null;

export function createElement(
  kind: ElementKind,
  width: number,
  height: number,
  color = "#283D31",
): CanvasElement {
  const w = width * (kind === "icon" ? 0.14 : kind === "logo" ? 0.32 : 0.5);
  let h =
    kind === "text" || kind === "line" || kind === "logo"
      ? width * 0.13
      : w * 0.8;
  if (kind === "icon") h = w;
  if (kind === "device") h = (w * 3000) / 1470;
  const base = {
    id: nid(),
    name: ELEMENT_INFO[kind].name,
    transform: {
      x: (width - w) / 2,
      y: (height - h) / 2,
      width: w,
      height: h,
      zIndex: 10,
    },
    opacity: 100,
  };
  if (kind === "image" || kind === "logo" || kind === "detail")
    return {
      ...base,
      kind,
      asset: { src: "", crop: { x: 50, y: 50, zoom: 1 } },
      fit: kind === "logo" ? "contain" : "cover",
      radius: 0,
      lockAspect: kind === "logo",
    };
  if (kind === "device")
    return {
      ...base,
      kind,
      device: "iphone",
      orientation: "portrait",
      src: "",
    };
  if (kind === "cards")
    return {
      ...base,
      kind,
      items: [
        { asset: { src: "" }, title: {} },
        { asset: { src: "" }, title: {} },
      ],
      layout: "row",
      gap: 24,
      radius: 12,
      color,
      fontSize: Math.round(width * 0.028),
    };
  if (kind === "shape")
    return {
      ...base,
      kind,
      shape: "rectangle",
      fill: "#DEDCD2",
      stroke: color,
      strokeWidth: 0,
      radius: 0,
    };
  if (kind === "line")
    return { ...base, kind, color, thickness: 6, arrow: true, dashed: false };
  if (kind === "icon")
    return { ...base, kind, icon: "play", color, strokeWidth: 1.5 };
  return {
    ...base,
    kind: "text",
    text: {},
    fontSize: Math.round(width * 0.055),
    fontWeight: 600,
    color,
    align: "center",
  };
}

export function elementPaths(element: CanvasElement): string[] {
  if (element.hidden) return [];
  if (
    element.kind === "image" ||
    element.kind === "logo" ||
    element.kind === "detail"
  )
    return [element.asset.src];
  if (element.kind === "cards")
    return element.items.map((item) => item.asset.src);
  if (element.kind === "device") {
    const frame = appleFrame(element.device, element.orientation);
    return [element.src, ...(frame ? [framePath(frame)] : [])];
  }
  return [];
}
export function cloneElements(
  elements: CanvasElement[],
  offset = 32,
): CanvasElement[] {
  const groups = new Map<string, string>();
  return structuredClone(elements).map((element) => {
    if (element.groupId && !groups.has(element.groupId))
      groups.set(element.groupId, nid());
    return {
      ...element,
      id: nid(),
      groupId: element.groupId ? groups.get(element.groupId) : undefined,
      transform: {
        ...element.transform,
        x: element.transform.x + offset,
        y: element.transform.y + offset,
      },
    };
  });
}
export function moveElement(
  elements: CanvasElement[],
  id: string,
  transform: ElementTransform,
): CanvasElement[] {
  const target = elements.find((e) => e.id === id);
  if (
    !target ||
    target.locked ||
    (target.groupId &&
      elements.some((e) => e.groupId === target.groupId && e.locked))
  )
    return elements;
  const dx = transform.x - target.transform.x,
    dy = transform.y - target.transform.y;
  return elements.map((e) =>
    e.id === id
      ? { ...e, transform }
      : target.groupId && e.groupId === target.groupId
        ? {
            ...e,
            transform: {
              ...e.transform,
              x: e.transform.x + dx,
              y: e.transform.y + dy,
            },
          }
        : e,
  );
}
export function selectedWithGroups(elements: CanvasElement[], ids: string[]) {
  const groups = new Set(
    elements
      .filter((e) => ids.includes(e.id) && e.groupId)
      .map((e) => e.groupId),
  );
  return elements.filter(
    (e) => ids.includes(e.id) || (e.groupId && groups.has(e.groupId)),
  );
}
export function boundsOf(elements: CanvasElement[]) {
  const x = Math.min(...elements.map((e) => e.transform.x)),
    y = Math.min(...elements.map((e) => e.transform.y));
  return {
    x,
    y,
    width:
      Math.max(...elements.map((e) => e.transform.x + e.transform.width)) - x,
    height:
      Math.max(...elements.map((e) => e.transform.y + e.transform.height)) - y,
  };
}
export function saveGroup(name: string, elements: CanvasElement[]): SavedGroup {
  const bounds = boundsOf(elements);
  return {
    id: nid(),
    name,
    width: bounds.width,
    height: bounds.height,
    elements: structuredClone(elements).map((e) => ({
      ...e,
      transform: {
        ...e.transform,
        x: e.transform.x - bounds.x,
        y: e.transform.y - bounds.y,
      },
    })),
  };
}
export function placeGroup(
  group: SavedGroup,
  width: number,
  height: number,
): CanvasElement[] {
  const scale = Math.min(
      1,
      (width * 0.85) / group.width,
      (height * 0.85) / group.height,
    ),
    groupId = nid();
  return cloneElements(group.elements, 0)
    .sort((a, b) => (a.transform.zIndex ?? 10) - (b.transform.zIndex ?? 10))
    .map((e, i) => ({
      ...e,
      locked: false,
      groupId,
      transform: {
        ...e.transform,
        x: (width - group.width * scale) / 2 + e.transform.x * scale,
        y: (height - group.height * scale) / 2 + e.transform.y * scale,
        width: e.transform.width * scale,
        height: e.transform.height * scale,
        zIndex: 10 + i,
      },
      ...("radius" in e ? { radius: e.radius * scale } : {}),
      ...(e.kind === "cards" ? { gap: e.gap * scale } : {}),
      ...(e.kind === "shape" ? { strokeWidth: e.strokeWidth * scale } : {}),
      ...(e.kind === "line"
        ? { thickness: Math.max(1, e.thickness * scale) }
        : {}),
      ...(e.kind === "text" || e.kind === "cards"
        ? { fontSize: Math.max(8, e.fontSize * scale) }
        : {}),
    }));
}
export function arrangeElements(
  elements: CanvasElement[],
  ids: string[],
  action:
    | "left"
    | "center"
    | "right"
    | "top"
    | "middle"
    | "bottom"
    | "space-x"
    | "space-y",
  width: number,
  height: number,
): CanvasElement[] {
  const selected = selectedWithGroups(elements, ids);
  if (!selected.length || selected.some((e) => e.locked)) return elements;
  const grouped = new Map<string, CanvasElement[]>();
  for (const e of selected) {
    const key = e.groupId || e.id;
    grouped.set(key, [...(grouped.get(key) || []), e]);
  }
  const units = [...grouped.values()].map((items) => ({
    items,
    transform: boundsOf(items),
  }));
  const b =
    units.length === 1 ? { x: 0, y: 0, width, height } : boundsOf(selected);
  const updates = new Map<string, ElementTransform>();
  const apply = (unit: (typeof units)[number], x: number, y: number) => {
    for (const e of unit.items)
      updates.set(e.id, {
        ...e.transform,
        x: e.transform.x + x - unit.transform.x,
        y: e.transform.y + y - unit.transform.y,
      });
  };
  if (action.startsWith("space-")) {
    if (units.length < 3) return elements;
    const axis = action === "space-x" ? "x" : "y",
      dimension = axis === "x" ? "width" : "height";
    const sorted = [...units].sort(
      (a, b) => a.transform[axis] - b.transform[axis],
    );
    const total = sorted.reduce((sum, e) => sum + e.transform[dimension], 0),
      gap = (b[dimension] - total) / (sorted.length - 1);
    let position = b[axis];
    for (const unit of sorted) {
      apply(
        unit,
        axis === "x" ? position : unit.transform.x,
        axis === "y" ? position : unit.transform.y,
      );
      position += unit.transform[dimension] + gap;
    }
  } else
    for (const unit of units) {
      const t = { ...unit.transform };
      if (action === "left") t.x = b.x;
      if (action === "center") t.x = b.x + (b.width - t.width) / 2;
      if (action === "right") t.x = b.x + b.width - t.width;
      if (action === "top") t.y = b.y;
      if (action === "middle") t.y = b.y + (b.height - t.height) / 2;
      if (action === "bottom") t.y = b.y + b.height - t.height;
      apply(unit, t.x, t.y);
    }
  return elements.map((e) =>
    updates.has(e.id) ? { ...e, transform: updates.get(e.id)! } : e,
  );
}
export function projectAssets(state: ProjectState): ProjectAsset[] {
  const assets = [...(state.assets || [])],
    seen = new Set(assets.map((a) => a.src));
  const add = (
    src: string | undefined,
    name: string,
    category: ProjectAsset["category"],
  ) => {
    if (src && !seen.has(src) && !src.startsWith("/api/")) {
      seen.add(src);
      assets.push({ id: src, name, src, category });
    }
  };
  add(state.appIcon, "App icon", "logo");
  if (state.background?.kind === "image")
    add(state.background.image.src, "Background", "photo");
  for (const slide of Object.values(state.slidesByDevice).flat()) {
    add(slide.screenshot, "App screenshot", "screenshot");
    add(slide.screenshotSecondary, "Second screenshot", "screenshot");
    add(slide.photo?.src, "Creator photo", "photo");
    if (slide.background?.kind === "image")
      add(slide.background.image.src, "Background", "photo");
    slide.artworks?.forEach((a) => add(a.src, "Content cover", "cover"));
  }
  const allElements = [
    ...Object.values(state.slidesByDevice)
      .flat()
      .flatMap((s) => s.elements || []),
    ...(state.savedGroups || []).flatMap((g) => g.elements),
  ];
  for (const e of allElements)
    for (const src of elementPaths({ ...e, hidden: false }))
      add(
        src,
        e.name,
        e.kind === "logo"
          ? "logo"
          : e.kind === "device" || e.kind === "detail"
            ? "screenshot"
            : e.kind === "cards"
              ? "cover"
              : "photo",
      );
  return assets;
}
export function copyToSlides(
  slides: Slide[],
  sourceId: string,
  targetIds: string[],
  elements: CanvasElement[],
): Slide[] {
  return slides.map((slide) =>
    slide.id !== sourceId && targetIds.includes(slide.id)
      ? {
          ...slide,
          elements: [...(slide.elements || []), ...cloneElements(elements, 0)],
        }
      : slide,
  );
}
