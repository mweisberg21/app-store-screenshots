"use client";
import * as React from "react";
import type {
  BuiltInElementId,
  Device,
  ElementId,
  ElementTransform,
  Orientation,
  SelectedElement,
  Slide,
  TextElement,
  Theme,
} from "@/lib/types";
import {
  CANVAS,
  IPAD_RATIO,
  IPAD_LANDSCAPE_RATIO,
  MK_RATIO,
  ipadW,
  phoneW,
  phoneWSmall,
  tabletLW,
  tabletPW,
} from "@/lib/constants";
import { toTextElementId } from "@/lib/elements";
import { fitFrameRect } from "@/lib/apple-frames";
import { img } from "@/lib/image-cache";
import { pickText, resolveScreenshot } from "@/lib/locale";
import { artworkRects, mediaTemplateRects } from "@/lib/template-layout";
import { Movable } from "./movable";
import { CanvasElements } from "./canvas-elements";
import { CroppedImage } from "./cropped-image";
import { effectiveBackground, themeForSlide } from "@/lib/background";
import { BackgroundLayer } from "./background-layer";
import {
  AndroidPhone,
  AndroidTabletL,
  AndroidTabletP,
  IPad,
  IPadLandscape,
  Phone,
} from "./device-frames";

type FrameComp = React.ComponentType<{
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  hideEmpty?: boolean;
}>;

export function getCanvas(device: Device, orientation: Orientation) {
  const c = CANVAS[device];
  if (c.wL && c.hL && orientation === "landscape") {
    return { cW: c.wL!, cH: c.hL! };
  }
  return { cW: c.w, cH: c.h };
}

// Aspect ratio (w/h) of each device frame — must match device-frames.tsx
function getFrameAspect(device: Device, orientation: Orientation) {
  switch (device) {
    case "iphone":
      return MK_RATIO;
    case "android":
      return 9 / 19.5;
    case "ipad":
      return orientation === "landscape" ? IPAD_LANDSCAPE_RATIO : IPAD_RATIO;
    case "android-7":
    case "android-10":
      return orientation === "landscape" ? 8 / 5 : 5 / 8;
    default:
      return 1;
  }
}

export function getFrameForDevice(
  device: Device,
  orientation: Orientation,
): {
  Comp: FrameComp;
  widthFn: (cW: number, cH: number) => number;
  smallWidthFn: (cW: number, cH: number) => number;
} {
  switch (device) {
    case "iphone":
      return { Comp: Phone, widthFn: phoneW, smallWidthFn: phoneWSmall };
    case "ipad":
      if (orientation === "landscape")
        return {
          Comp: IPadLandscape,
          widthFn: (w, h) =>
            Math.min(0.82, ((0.72 * h) / w) * IPAD_LANDSCAPE_RATIO),
          smallWidthFn: (w, h) =>
            Math.min(0.6, ((0.6 * h) / w) * IPAD_LANDSCAPE_RATIO),
        };
      return {
        Comp: IPad,
        widthFn: ipadW,
        smallWidthFn: (cW, cH) => ipadW(cW, cH, 0.6),
      };
    case "android":
      return { Comp: AndroidPhone, widthFn: phoneW, smallWidthFn: phoneWSmall };
    case "android-7":
    case "android-10":
      if (orientation === "landscape") {
        return {
          Comp: AndroidTabletL,
          widthFn: tabletLW,
          smallWidthFn: (cW, cH) => tabletLW(cW, cH, 0.5),
        };
      }
      return {
        Comp: AndroidTabletP,
        widthFn: tabletPW,
        smallWidthFn: (cW, cH) => tabletPW(cW, cH, 0.62),
      };
    default:
      return { Comp: Phone, widthFn: phoneW, smallWidthFn: phoneWSmall };
  }
}

type EditHandlers = {
  onLabelChange?: (v: string) => void;
  onHeadlineChange?: (v: string) => void;
  onTextElementTextChange?: (id: string, v: string) => void;
  onElementChange?: (id: ElementId, t: ElementTransform) => void;
  onSelectElement?: (id: ElementId | null) => void;
};

type Props = {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  editable?: boolean;
  edit?: EditHandlers;
  selectedElementId?: ElementId | null;
  // Preview scale (1.0 = full size). Used so react-rnd maps drag deltas correctly
  // when the canvas is rendered inside a CSS-transformed container.
  previewScale?: number;
  /** When true, suppress the "Drop a screenshot here" placeholder. Used for export. */
  hideEmpty?: boolean;
};

type DeckEditHandlers = {
  onLabelChange?: (slideId: string, v: string) => void;
  onHeadlineChange?: (slideId: string, v: string) => void;
  onTextElementTextChange?: (slideId: string, id: string, v: string) => void;
  onElementChange?: (
    slideId: string,
    id: ElementId,
    t: ElementTransform,
  ) => void;
  onSelectElement?: (element: SelectedElement | null) => void;
  onSelectScreen?: (slideId: string) => void;
};

type DeckCanvasProps = {
  slides: Slide[];
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  connectedCanvas?: boolean;
  editable?: boolean;
  edit?: DeckEditHandlers;
  selectedElement?: SelectedElement | null;
  activeSlideId?: string | null;
  previewScale?: number;
  hideEmpty?: boolean;
  showGuides?: boolean;
};

// ---------- Editable text helpers ----------

function EditableText({
  value,
  editable,
  onChange,
  style,
  multiline = false,
  placeholder,
  onFocus,
}: {
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  onFocus?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = value || "";
    if (el.textContent !== incoming && document.activeElement !== el) {
      el.textContent = incoming;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const text = (e.currentTarget.innerText || "").replace(/\u00a0/g, " ");
    onChange(multiline ? text : text.replace(/\n/g, ""));
  };

  return (
    <div
      ref={ref}
      data-text-leaf
      contentEditable={editable}
      suppressContentEditableWarning
      data-placeholder={editable ? placeholder : undefined}
      onInput={handleInput}
      onFocus={() => onFocus?.()}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onMouseDown={(e) => {
        // Allow text editing without starting an Rnd drag.
        if (editable) {
          e.stopPropagation();
          onFocus?.();
        }
      }}
      onPointerDown={(e) => {
        if (editable) e.stopPropagation();
      }}
      style={{
        outline: "none",
        whiteSpace: multiline ? "pre-wrap" : "nowrap",
        cursor: editable ? "text" : "default",
        ...style,
      }}
    />
  );
}

// ---------- Caption (label + headline) ----------

function Caption({
  cW,
  cH,
  slide,
  theme,
  locale,
  editable,
  edit,
  align = "center",
  inverted,
  onFocus,
}: {
  cW: number;
  cH: number;
  slide: Slide;
  theme: Theme;
  locale: string;
  editable?: boolean;
  edit?: EditHandlers;
  align?: "center" | "left";
  inverted?: boolean;
  onFocus?: () => void;
}) {
  const fg = inverted ? theme.fgAlt : theme.fg;
  const label = pickText(slide.label, locale);
  // Scale typography off the *shorter* dimension so landscape layouts don't
  // produce headlines so tall they overlap the device frame.
  const unit = Math.min(cW, cH);
  return (
    <div
      data-text-content
      style={{
        textAlign: theme.textAlign ?? align,
        fontFamily: theme.fontFamily,
        position: "relative",
        width: "100%",
      }}
    >
      {label && (
        <EditableText
          value={label}
          editable={editable}
          onChange={edit?.onLabelChange}
          onFocus={onFocus}
          placeholder="LABEL"
          style={{
            fontSize: unit * 0.028,
            fontWeight: 600,
            letterSpacing: unit * 0.0015,
            color: fg,
            textTransform: "uppercase",
            marginBottom: unit * 0.018,
            minHeight: unit * 0.03,
          }}
        />
      )}
      <EditableText
        value={pickText(slide.headline, locale)}
        editable={editable}
        multiline
        onChange={edit?.onHeadlineChange}
        onFocus={onFocus}
        placeholder="Write one clear benefit"
        style={{
          fontSize: unit * 0.13,
          fontWeight: 700,
          lineHeight: 1.06,
          overflowWrap: "anywhere",
          textWrap: "balance",
          letterSpacing: -unit * 0.001,
          color: fg,
        }}
      />
    </div>
  );
}

// ---------- Default element rects per layout ----------

type Rect = { x: number; y: number; width: number; height: number };
type LayoutRects = {
  caption?: Rect & { align?: "center" | "left" };
  device?: Rect;
  deviceSecondary?: Rect;
};

function getDefaultRects(
  layout: Slide["layout"],
  cW: number,
  cH: number,
  frameAspect: number,
  fwFrac: number,
  fwSmallFrac: number,
): LayoutRects {
  const deviceW = fwFrac * cW;
  const deviceH = deviceW / frameAspect;
  const smallW = fwSmallFrac * cW;
  const smallH = smallW / frameAspect;
  const capW = cW * 0.84;
  const capH = cH * 0.28;

  switch (layout) {
    case "creator":
    case "content-library":
      return mediaTemplateRects(cW, cH, frameAspect, layout);
    case "hero":
      return {
        caption: {
          x: cW * 0.08,
          y: cH * 0.09,
          width: capW,
          height: capH,
          align: "center",
        },
        device: {
          x: (cW - deviceW) / 2,
          y: cH - deviceH + deviceH * 0.15,
          width: deviceW,
          height: deviceH,
        },
      };
    case "device-bottom": {
      const landscape = cW > cH;
      const width = Math.min(
        cW * 0.84,
        cH * (landscape ? 0.56 : 0.65) * frameAspect,
      );
      const height = width / frameAspect;
      return {
        caption: {
          x: cW * 0.08,
          y: cH * 0.06,
          width: capW,
          height: cH * (landscape ? 0.3 : 0.22),
          align: "center",
        },
        device: {
          x: (cW - width) / 2,
          y: cH * 0.96 - height,
          width,
          height,
        },
      };
    }
    case "device-top":
      return {
        caption: {
          x: cW * 0.08,
          y: cH * 0.65,
          width: capW,
          height: capH,
          align: "center",
        },
        device: {
          x: (cW - deviceW) / 2,
          y: -cH * 0.1,
          width: deviceW,
          height: deviceH,
        },
      };
    case "two-devices":
      return {
        caption: {
          x: cW * 0.08,
          y: cH * 0.08,
          width: capW,
          height: capH,
          align: "center",
        },
        deviceSecondary: {
          x: -cW * 0.06,
          y: cH - smallH - cH * 0.05,
          width: smallW,
          height: smallH,
        },
        device: {
          x: cW - deviceW * 0.9 + cW * 0.06,
          y: cH - deviceH * 0.9 - cH * 0.02,
          width: deviceW * 0.9,
          height: (deviceW * 0.9) / frameAspect,
        },
      };
    case "no-device":
      return {
        caption: {
          x: cW * 0.1,
          y: cH * 0.35,
          width: cW * 0.8,
          height: cH * 0.3,
          align: "center",
        },
      };
    case "split-landscape":
      return {
        caption: {
          x: cW * 0.05,
          y: cH * 0.25,
          width: cW * 0.38,
          height: cH * 0.5,
          align: "left",
        },
        device: {
          x: cW - deviceW + cW * 0.03,
          y: (cH - deviceH) / 2,
          width: deviceW,
          height: deviceH,
        },
      };
    default:
      return {};
  }
}

function rectFor(
  id: BuiltInElementId,
  slide: Slide,
  defaults: LayoutRects,
): (Rect & { align?: "center" | "left" }) | undefined {
  const saved = slide.transforms?.[id];
  const def = defaults[id];
  if (!def && !saved) return undefined;
  if (!saved) return def;
  return {
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
    align: (def as { align?: "center" | "left" } | undefined)?.align,
  };
}

function getSlideGeometry(
  slide: Slide,
  device: Device,
  orientation: Orientation,
) {
  const { cW, cH } = getCanvas(device, orientation);
  const {
    Comp: Frame,
    widthFn,
    smallWidthFn,
  } = getFrameForDevice(device, orientation);
  const frameAspect = getFrameAspect(device, orientation);
  const fwFrac = widthFn(cW, cH);
  const fwSmallFrac = smallWidthFn(cW, cH);
  const defaults = getDefaultRects(
    slide.layout,
    cW,
    cH,
    frameAspect,
    fwFrac,
    fwSmallFrac,
  );
  return { cW, cH, Frame, frameAspect, defaults };
}

export function getElementTransform(
  slide: Slide,
  device: Device,
  orientation: Orientation,
  id: ElementId,
): ElementTransform | undefined {
  if (id.startsWith("element:"))
    return slide.elements?.find((e) => e.id === id.slice(8))?.transform;
  if (id.startsWith("text:")) {
    const textId = id.slice("text:".length);
    const textElement = slide.textElements?.find(
      (element) => element.id === textId,
    );
    return textElement?.transform;
  }
  const { defaults } = getSlideGeometry(slide, device, orientation);
  const rect = rectFor(id as BuiltInElementId, slide, defaults);
  if (!rect) return undefined;
  const saved = slide.transforms?.[id as BuiltInElementId];
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    rotation: saved?.rotation ?? 0,
    zIndex: saved?.zIndex ?? defaultElementZ(id as BuiltInElementId),
  };
}

function defaultElementZ(id: BuiltInElementId): number {
  if (id === "deviceSecondary") return 2;
  if (id === "device") return 3;
  return 4;
}

// ---------- Main single-screen canvas ----------

export function SlideCanvas({
  slide,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  editable,
  edit,
  selectedElementId = null,
  previewScale = 1,
  hideEmpty,
}: Props) {
  const { cW, cH } = getCanvas(device, orientation);

  if (slide.layout === "feature-graphic" || device === "feature-graphic") {
    return (
      <FeatureGraphicCanvas
        slide={slide}
        cW={cW}
        cH={cH}
        selectedElementId={selectedElementId}
        previewScale={previewScale}
        hideEmpty={hideEmpty}
        theme={theme}
        locale={locale}
        appName={appName}
        appIcon={appIcon}
        editable={editable}
        edit={edit}
      />
    );
  }

  const handleBackgroundMouseDown = editable
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) edit?.onSelectElement?.(null);
      }
    : undefined;

  return (
    <div
      onMouseDown={handleBackgroundMouseDown}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundLayer
        background={effectiveBackground(slide, theme)}
        locale={locale}
      />
      <SlideElements
        slide={slide}
        device={device}
        orientation={orientation}
        theme={theme}
        locale={locale}
        editable={editable}
        edit={edit}
        selectedElementId={selectedElementId}
        previewScale={previewScale}
        hideEmpty={hideEmpty}
        screenX={0}
        boundsW={cW}
        boundsH={cH}
        allowCrossScreen={false}
      />
    </div>
  );
}

// ---------- Connected deck canvas ----------

export function DeckCanvas({
  slides,
  device,
  orientation,
  theme,
  locale,
  appName,
  appIcon,
  connectedCanvas = true,
  editable,
  edit,
  selectedElement = null,
  activeSlideId = null,
  previewScale = 1,
  hideEmpty,
  showGuides = false,
}: DeckCanvasProps) {
  const { cW, cH } = getCanvas(device, orientation);
  const totalW = Math.max(1, slides.length) * cW;

  return (
    <div
      style={{
        width: totalW,
        height: cH,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {slides.map((slide, index) => {
        const screenX = index * cW;
        const active = activeSlideId === slide.id;
        if (
          slide.layout === "feature-graphic" ||
          device === "feature-graphic"
        ) {
          return (
            <div
              key={`${slide.id}-feature`}
              onMouseDown={(e) => {
                if (
                  !editable ||
                  e.defaultPrevented ||
                  (e.target as HTMLElement).closest(".rnd-editable")
                )
                  return;
                edit?.onSelectScreen?.(slide.id);
                edit?.onSelectElement?.(null);
              }}
              style={{
                position: "absolute",
                left: screenX,
                top: 0,
                width: cW,
                height: cH,
                overflow: "hidden",
              }}
            >
              <FeatureGraphicCanvas
                slide={slide}
                cW={cW}
                cH={cH}
                selectedElementId={
                  selectedElement?.slideId === slide.id
                    ? selectedElement.elementId
                    : null
                }
                previewScale={previewScale}
                hideEmpty={hideEmpty}
                theme={theme}
                locale={locale}
                appName={appName}
                appIcon={appIcon}
                editable={editable}
                edit={{
                  onHeadlineChange: (v) =>
                    edit?.onHeadlineChange?.(slide.id, v),
                  onElementChange: (id, t) =>
                    edit?.onElementChange?.(slide.id, id, t),
                  onSelectElement: (id) => {
                    edit?.onSelectScreen?.(slide.id);
                    edit?.onSelectElement?.(
                      id ? { slideId: slide.id, elementId: id } : null,
                    );
                  },
                }}
              />
              {showGuides && (
                <ScreenGuide cW={cW} cH={cH} index={index} active={active} />
              )}
            </div>
          );
        }
        return (
          <div
            key={`${slide.id}-bg`}
            onMouseDown={(e) => {
              if (
                !editable ||
                e.defaultPrevented ||
                (e.target as HTMLElement).closest(".rnd-editable")
              )
                return;
              edit?.onSelectScreen?.(slide.id);
              edit?.onSelectElement?.(null);
            }}
            style={{
              position: "absolute",
              left: screenX,
              top: 0,
              width: cW,
              height: cH,
              overflow: "hidden",
            }}
          >
            <BackgroundLayer
              background={effectiveBackground(slide, theme)}
              locale={locale}
            />
            {showGuides && (
              <ScreenGuide cW={cW} cH={cH} index={index} active={active} />
            )}
          </div>
        );
      })}

      {slides.map((slide, index) => {
        if (slide.layout === "feature-graphic" || device === "feature-graphic")
          return null;
        const selectedElementId =
          selectedElement?.slideId === slide.id
            ? selectedElement.elementId
            : null;
        const perSlideEdit: EditHandlers | undefined = editable
          ? {
              onLabelChange: (v) => edit?.onLabelChange?.(slide.id, v),
              onHeadlineChange: (v) => edit?.onHeadlineChange?.(slide.id, v),
              onTextElementTextChange: (id, v) =>
                edit?.onTextElementTextChange?.(slide.id, id, v),
              onElementChange: (id, t) =>
                edit?.onElementChange?.(slide.id, id, t),
              onSelectElement: (id) => {
                edit?.onSelectScreen?.(slide.id);
                edit?.onSelectElement?.(
                  id ? { slideId: slide.id, elementId: id } : null,
                );
              },
            }
          : undefined;

        const elements = (
          <SlideElements
            key={`${slide.id}-elements`}
            slide={slide}
            device={device}
            orientation={orientation}
            theme={theme}
            locale={locale}
            editable={editable}
            edit={perSlideEdit}
            selectedElementId={selectedElementId}
            previewScale={previewScale}
            hideEmpty={hideEmpty}
            screenX={connectedCanvas ? index * cW : 0}
            boundsW={connectedCanvas ? totalW : cW}
            boundsH={cH}
            allowCrossScreen={connectedCanvas}
          />
        );
        if (connectedCanvas) return elements;
        return (
          <div
            key={`${slide.id}-elements-isolated`}
            style={{
              position: "absolute",
              left: index * cW,
              top: 0,
              width: cW,
              height: cH,
              overflow: "hidden",
            }}
          >
            {elements}
          </div>
        );
      })}
    </div>
  );
}

function ScreenGuide({
  cW,
  cH,
  index,
  active,
}: {
  cW: number;
  cH: number;
  index: number;
  active: boolean;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        outline: `${active ? Math.max(4, cW * 0.003) : Math.max(2, cW * 0.0015)}px solid ${
          active ? "rgba(48, 48, 48, 0.9)" : "rgba(15, 23, 42, 0.22)"
        }`,
        outlineOffset: active
          ? -Math.max(4, cW * 0.003)
          : -Math.max(2, cW * 0.0015),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: cW * 0.035,
          top: cH * 0.024,
          borderRadius: cW * 0.018,
          padding: `${cH * 0.006}px ${cW * 0.018}px`,
          background: active
            ? "rgba(48, 48, 48, 0.92)"
            : "rgba(15, 23, 42, 0.72)",
          color: "white",
          fontSize: Math.max(24, cW * 0.022),
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}

function FeatureGraphicCanvas({
  slide,
  cW,
  cH,
  selectedElementId = null,
  previewScale = 1,
  hideEmpty,
  theme: baseTheme,
  locale,
  appName,
  appIcon,
  editable,
  edit,
}: {
  slide: Slide;
  cW: number;
  cH: number;
  selectedElementId?: ElementId | null;
  previewScale?: number;
  hideEmpty?: boolean;
  theme: Theme;
  locale: string;
  appName?: string;
  appIcon?: string;
  editable?: boolean;
  edit?: EditHandlers;
}) {
  const theme = themeForSlide(slide, baseTheme);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: slide.inverted ? theme.bgAlt : theme.bg,
        fontFamily: theme.fontFamily,
        display: "flex",
        alignItems: "center",
        padding: `0 ${cW * 0.06}px`,
        color: slide.inverted ? theme.fgAlt : theme.fg,
      }}
    >
      <BackgroundLayer
        background={effectiveBackground(slide, theme)}
        locale={locale}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: cW * 0.03,
          zIndex: 2,
        }}
      >
        {appIcon && img(appIcon) ? (
          <img
            src={img(appIcon)}
            alt=""
            style={{
              width: cW * 0.13,
              height: cW * 0.13,
              borderRadius: cW * 0.022,
            }}
            draggable={false}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: cW * 0.13,
              height: cW * 0.13,
              borderRadius: cW * 0.022,
              background: theme.fg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.bg,
              fontWeight: 800,
              fontSize: cW * 0.07,
            }}
          >
            {(appName || "A").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div
          data-text-box
          data-slide-id={slide.id}
          style={{
            width: cW * 0.7,
            height: cW * 0.37,
            display: "flex",
            alignItems: "center",
            textAlign: theme.textAlign,
          }}
        >
          <div data-text-content style={{ width: "100%" }}>
            <div
              data-text-leaf
              style={{
                fontSize: cW * 0.06,
                fontWeight: 800,
                lineHeight: 1.05,
                overflowWrap: "anywhere",
              }}
            >
              {appName || "App"}
            </div>
            <EditableText
              value={pickText(slide.headline, locale)}
              editable={editable}
              multiline
              onChange={edit?.onHeadlineChange}
              style={{
                fontSize: cW * 0.028,
                color: "inherit",
                marginTop: cW * 0.012,
                lineHeight: 1.25,
              }}
            />
          </div>
        </div>
      </div>
      <CanvasElements
        canvasWidth={cW}
        slide={slide}
        locale={locale}
        theme={theme}
        editable={editable}
        hideEmpty={hideEmpty}
        screenX={0}
        boundsW={cW}
        boundsH={cH}
        previewScale={previewScale}
        selectedId={selectedElementId}
        onSelect={edit?.onSelectElement}
        onChange={edit?.onElementChange}
      />
    </div>
  );
}

function SlideElements({
  slide,
  device,
  orientation,
  theme: baseTheme,
  locale,
  editable,
  edit,
  selectedElementId,
  previewScale,
  hideEmpty,
  screenX,
  boundsW,
  boundsH,
  allowCrossScreen,
}: {
  slide: Slide;
  device: Device;
  orientation: Orientation;
  theme: Theme;
  locale: string;
  editable?: boolean;
  edit?: EditHandlers;
  selectedElementId: ElementId | null;
  previewScale: number;
  hideEmpty?: boolean;
  screenX: number;
  boundsW: number;
  boundsH: number;
  allowCrossScreen: boolean;
}) {
  const theme = themeForSlide(slide, baseTheme);
  const screenshot = resolveScreenshot(slide.screenshot, locale);
  const screenshotSecondary = resolveScreenshot(
    slide.screenshotSecondary,
    locale,
  );
  const { cW, cH, Frame, frameAspect, defaults } = getSlideGeometry(
    slide,
    device,
    orientation,
  );
  const inverted = !!slide.inverted;
  const captionRect = rectFor("caption", slide, defaults);
  const deviceRect = rectFor("device", slide, defaults);
  const secondaryRect = rectFor("deviceSecondary", slide, defaults);

  function toGlobal(rect: Rect): Rect {
    return { ...rect, x: rect.x + screenX };
  }

  function toLocal(t: ElementTransform): ElementTransform {
    return { ...t, x: t.x - screenX };
  }

  function renderCaption() {
    if (!captionRect) return null;
    const saved = slide.transforms?.caption;
    const rotation = saved?.rotation ?? 0;
    const zIndex = saved?.zIndex ?? 4;
    const inner = (
      <Caption
        cW={cW}
        cH={cH}
        slide={slide}
        theme={theme}
        locale={locale}
        editable={editable}
        edit={edit}
        align={captionRect.align || "center"}
        inverted={inverted}
        onFocus={() => edit?.onSelectElement?.("caption")}
      />
    );
    return (
      <Movable
        rect={toGlobal(captionRect)}
        boundsW={boundsW}
        boundsH={boundsH}
        editable={editable}
        previewScale={previewScale}
        rotation={rotation}
        onChange={(t) =>
          edit?.onElementChange?.(
            "caption",
            toLocal({
              ...t,
              rotation: t.rotation ?? rotation,
              zIndex: t.zIndex ?? zIndex,
            }),
          )
        }
        zIndex={zIndex}
        selected={selectedElementId === "caption"}
        onSelect={() => edit?.onSelectElement?.("caption")}
        allowOverflow={allowCrossScreen}
      >
        <div
          data-text-box
          data-slide-id={slide.id}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {inner}
        </div>
      </Movable>
    );
  }

  function renderDevice(
    id: "device" | "deviceSecondary",
    rect: Rect,
    src: string,
    extraStyle?: React.CSSProperties,
  ) {
    const fitted =
      device === "iphone" || device === "ipad"
        ? fitFrameRect(rect, frameAspect)
        : rect;
    const saved = slide.transforms?.[id];
    const rotation = saved?.rotation ?? 0;
    const zIndex = saved?.zIndex ?? (id === "deviceSecondary" ? 2 : 3);
    return (
      <Movable
        rect={toGlobal(fitted)}
        boundsW={boundsW}
        boundsH={boundsH}
        editable={editable}
        previewScale={previewScale}
        rotation={rotation}
        onChange={(t) =>
          edit?.onElementChange?.(
            id,
            toLocal({
              ...t,
              rotation: t.rotation ?? rotation,
              zIndex: t.zIndex ?? zIndex,
            }),
          )
        }
        lockAspectRatio={frameAspect}
        zIndex={zIndex}
        allowOverflow
        selected={selectedElementId === id}
        onSelect={() => edit?.onSelectElement?.(id)}
      >
        <Frame
          src={src}
          hideEmpty={hideEmpty}
          style={{ width: "100%", height: "100%", ...extraStyle }}
        />
      </Movable>
    );
  }

  function renderTextElement(textElement: TextElement, index: number) {
    const elementId = toTextElementId(textElement.id);
    const rect = textElement.transform;
    const rotation = rect.rotation ?? 0;
    const zIndex = rect.zIndex ?? 5 + index;
    const textColor = textElement.color || (inverted ? theme.fgAlt : theme.fg);
    return (
      <Movable
        key={textElement.id}
        rect={toGlobal(rect)}
        boundsW={boundsW}
        boundsH={boundsH}
        editable={editable}
        previewScale={previewScale}
        rotation={rotation}
        onChange={(t) =>
          edit?.onElementChange?.(
            elementId,
            toLocal({
              ...t,
              rotation: t.rotation ?? rotation,
              zIndex: t.zIndex ?? zIndex,
            }),
          )
        }
        zIndex={zIndex}
        selected={selectedElementId === elementId}
        onSelect={() => edit?.onSelectElement?.(elementId)}
        allowOverflow={allowCrossScreen}
      >
        <div
          data-text-box
          data-slide-id={slide.id}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent:
              textElement.align === "right"
                ? "flex-end"
                : textElement.align === "left"
                  ? "flex-start"
                  : "center",
            padding: `${Math.min(cW, cH) * 0.012}px`,
          }}
        >
          <div data-text-content style={{ width: "100%" }}>
            <EditableText
              value={pickText(textElement.text, locale)}
              editable={editable}
              multiline
              onChange={(value) =>
                edit?.onTextElementTextChange?.(textElement.id, value)
              }
              onFocus={() => edit?.onSelectElement?.(elementId)}
              placeholder="Text"
              style={{
                width: "100%",
                color: textColor,
                fontFamily: theme.fontFamily,
                fontSize: textElement.fontSize ?? Math.min(cW, cH) * 0.06,
                fontWeight: textElement.fontWeight ?? 700,
                lineHeight: 1.05,
                textAlign: textElement.align ?? "center",
              }}
            />
          </div>
        </div>
      </Movable>
    );
  }

  return (
    <>
      {(slide.layout === "creator" || slide.layout === "content-library") &&
        (() => {
          const region = mediaTemplateRects(
            cW,
            cH,
            frameAspect,
            slide.layout,
          ).media;
          const photoHeight = Math.min(region.height, region.width * 1.5);
          const rects =
            slide.layout === "creator"
              ? [
                  {
                    ...region,
                    y: region.y + (region.height - photoHeight) / 2,
                    height: photoHeight,
                  },
                ]
              : artworkRects(region, slide.artworks?.length || 2);
          return rects.map((rect, index) => (
            <div
              key={`art-${index}`}
              onMouseDown={() => edit?.onSelectElement?.(null)}
              style={{
                position: "absolute",
                left: screenX + rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                zIndex: 1,
              }}
            >
              <CroppedImage
                asset={
                  slide.layout === "creator"
                    ? slide.photo
                    : slide.artworks?.[index]
                }
                locale={locale}
                label={
                  slide.layout === "creator"
                    ? "Creator photo"
                    : `Catalog image ${index + 1}`
                }
                hideEmpty={hideEmpty}
                theme={theme}
              />
            </div>
          ));
        })()}
      {secondaryRect &&
        renderDevice(
          "deviceSecondary",
          secondaryRect,
          screenshotSecondary || screenshot,
          { opacity: 0.85 },
        )}
      {deviceRect && renderDevice("device", deviceRect, screenshot)}
      {renderCaption()}
      {(slide.textElements || []).map(renderTextElement)}
      <CanvasElements
        canvasWidth={cW}
        slide={slide}
        locale={locale}
        theme={theme}
        editable={editable}
        hideEmpty={hideEmpty}
        screenX={screenX}
        boundsW={boundsW}
        boundsH={boundsH}
        previewScale={previewScale}
        selectedId={selectedElementId}
        onSelect={edit?.onSelectElement}
        onChange={(id, t) => edit?.onElementChange?.(id, toLocal(t))}
      />
    </>
  );
}

// ---------- Movable wrapper ----------
