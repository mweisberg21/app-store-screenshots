"use client";
import {
  BookOpen,
  CalendarDays,
  Cast,
  Check,
  Clock3,
  Heart,
  Play,
  Users,
} from "lucide-react";
import type {
  CanvasElement,
  ElementId,
  ElementTransform,
  ImageAsset,
  Slide,
  Theme,
} from "@/lib/types";
import { img } from "@/lib/image-cache";
import { pickText, resolveScreenshot } from "@/lib/locale";
import { customId } from "@/lib/canvas-elements";
import { appleFrame, fitFrameRect } from "@/lib/apple-frames";
import { Movable } from "./movable";
import {
  Phone,
  IPad,
  IPadLandscape,
  AndroidPhone,
  AndroidTabletL,
  AndroidTabletP,
} from "./device-frames";

export const ELEMENT_ICONS = {
  play: Play,
  calendar: CalendarDays,
  community: Users,
  heart: Heart,
  book: BookOpen,
  check: Check,
  cast: Cast,
  clock: Clock3,
};
function AssetImage({
  asset,
  fit = "cover",
  locale,
  hideEmpty,
}: {
  asset: ImageAsset;
  fit?: "cover" | "contain";
  locale: string;
  hideEmpty?: boolean;
}) {
  const source = img(resolveScreenshot(asset.src, locale)),
    crop = asset.crop || { x: 50, y: 50, zoom: 1 };
  return source ? (
    <img
      src={source}
      alt=""
      draggable={false}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: `${crop.x}% ${crop.y}%`,
        transform: `scale(${crop.zoom})`,
        transformOrigin: `${crop.x}% ${crop.y}%`,
      }}
    />
  ) : hideEmpty ? null : (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: "#eceae4",
        color: "#57534e",
        fontSize: 28,
        textAlign: "center",
        padding: 20,
      }}
    >
      Choose an image
    </div>
  );
}
export function ElementArtwork({
  element: e,
  locale,
  theme,
  hideEmpty,
  slideId,
}: {
  element: CanvasElement;
  locale: string;
  theme: Theme;
  hideEmpty?: boolean;
  slideId: string;
}) {
  if (e.kind === "image" || e.kind === "logo" || e.kind === "detail")
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: e.radius,
          overflow: "hidden",
        }}
      >
        <AssetImage
          asset={e.asset}
          fit={e.fit}
          locale={locale}
          hideEmpty={hideEmpty}
        />
      </div>
    );
  if (e.kind === "shape")
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: e.fill,
          border: `${e.strokeWidth}px solid ${e.stroke}`,
          borderRadius: e.shape === "ellipse" ? "50%" : e.radius,
        }}
      />
    );
  if (e.kind === "icon") {
    const Icon = ELEMENT_ICONS[e.icon];
    return (
      <Icon
        width="100%"
        height="100%"
        color={e.color}
        strokeWidth={e.strokeWidth}
      />
    );
  }
  if (e.kind === "line") {
    const { width: w, height: h } = e.transform,
      inset = Math.min(w / 4, e.thickness * 3),
      end = w - inset,
      y = h / 2;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <path
          d={`M ${inset} ${y} H ${end}`}
          fill="none"
          stroke={e.color}
          strokeWidth={e.thickness}
          strokeLinecap="round"
          strokeDasharray={
            e.dashed ? `${e.thickness * 3} ${e.thickness * 2}` : undefined
          }
        />
        {e.arrow && (
          <path
            d={`M ${end - inset} ${y - inset} L ${end} ${y} L ${end - inset} ${y + inset}`}
            fill="none"
            stroke={e.color}
            strokeWidth={e.thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  }
  if (e.kind === "device") {
    const Comp =
      e.device === "iphone"
        ? Phone
        : e.device === "ipad"
          ? e.orientation === "portrait"
            ? IPad
            : IPadLandscape
          : e.device === "android"
            ? AndroidPhone
            : e.orientation === "portrait"
              ? AndroidTabletP
              : AndroidTabletL;
    return (
      <Comp
        src={resolveScreenshot(e.src, locale)}
        hideEmpty={hideEmpty}
        style={{ width: "100%", height: "100%" }}
      />
    );
  }
  if (e.kind === "text")
    return (
      <div
        data-text-box
        data-slide-id={slideId}
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          fontFamily: theme.fontFamily,
          color: e.color,
          fontSize: e.fontSize,
          fontWeight: e.fontWeight,
          textAlign: e.align,
          lineHeight: 1.15,
          padding: 8,
        }}
      >
        <div
          data-text-content
          style={{
            width: "100%",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
        >
          {pickText(e.text, locale) || (!hideEmpty ? "Your text" : null)}
        </div>
      </div>
    );
  if (e.kind === "cards")
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${e.layout === "row" ? e.items.length : e.layout === "grid" ? 2 : 1},minmax(0,1fr))`,
          gridAutoRows: "minmax(0,1fr)",
          gap: e.gap,
          width: "100%",
          height: "100%",
        }}
      >
        {e.items.map((item, i) => (
          <div
            key={i}
            style={{
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: e.gap / 2,
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                borderRadius: e.radius,
                overflow: "hidden",
              }}
            >
              <AssetImage
                asset={item.asset}
                locale={locale}
                hideEmpty={hideEmpty}
              />
            </div>
            {Object.values(item.title).some(Boolean) && (
              <div
                data-text-box
                data-slide-id={slideId}
                style={{
                  height: e.fontSize * 2.5,
                  flexShrink: 0,
                  fontSize: e.fontSize,
                  color: e.color,
                  fontFamily: theme.fontFamily,
                  lineHeight: 1.2,
                }}
              >
                <div
                  data-text-content
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
                >
                  {pickText(item.title, locale)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
}
export function CanvasElements({
  slide,
  locale,
  theme,
  editable,
  hideEmpty,
  canvasWidth,
  screenX,
  boundsW,
  boundsH,
  previewScale,
  selectedId,
  onSelect,
  onChange,
}: {
  slide: Slide;
  locale: string;
  theme: Theme;
  editable?: boolean;
  hideEmpty?: boolean;
  canvasWidth: number;
  screenX: number;
  boundsW: number;
  boundsH: number;
  previewScale: number;
  selectedId: ElementId | null;
  onSelect?: (id: ElementId | null) => void;
  onChange?: (id: ElementId, t: ElementTransform) => void;
}) {
  return (
    <>
      {(slide.elements || [])
        .filter((e) => !e.hidden)
        .map((e) => {
          let rect = e.transform;
          let ratio: number | undefined;
          if (e.kind === "device") {
            const frame = appleFrame(e.device, e.orientation);
            ratio = frame
              ? frame.width / frame.height
              : e.device === "android"
                ? 9 / 19.5
                : e.orientation === "portrait"
                  ? 5 / 8
                  : 8 / 5;
            rect = { ...rect, ...fitFrameRect(rect, ratio) };
          }
          if (
            (e.kind === "image" || e.kind === "logo" || e.kind === "detail") &&
            e.lockAspect
          )
            ratio = rect.width / rect.height;
          const locked =
            e.locked ||
            !!(
              e.groupId &&
              slide.elements?.some(
                (other) => other.groupId === e.groupId && other.locked,
              )
            );
          const targets = {
            x: [screenX, screenX + canvasWidth / 2, screenX + canvasWidth],
            y: [0, boundsH / 2, boundsH],
          };
          for (const other of slide.elements || [])
            if (
              other.id !== e.id &&
              !other.hidden &&
              (!e.groupId || other.groupId !== e.groupId)
            ) {
              const t = other.transform;
              targets.x.push(
                screenX + t.x,
                screenX + t.x + t.width / 2,
                screenX + t.x + t.width,
              );
              targets.y.push(t.y, t.y + t.height / 2, t.y + t.height);
            }
          return (
            <Movable
              key={e.id}
              rect={{ ...rect, x: screenX + rect.x }}
              boundsW={boundsW}
              boundsH={boundsH}
              previewScale={previewScale}
              editable={editable}
              locked={locked}
              snap={targets}
              allowOverflow
              lockAspectRatio={ratio}
              rotation={rect.rotation}
              zIndex={rect.zIndex}
              selected={selectedId === customId(e.id)}
              onSelect={() => onSelect?.(customId(e.id))}
              onChange={(t) => onChange?.(customId(e.id), t)}
            >
              <div
                data-canvas-element={e.id}
                data-element-kind={e.kind}
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: e.opacity / 100,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <ElementArtwork
                  element={e}
                  locale={locale}
                  theme={theme}
                  hideEmpty={hideEmpty}
                  slideId={slide.id}
                />
              </div>
            </Movable>
          );
        })}
    </>
  );
}
