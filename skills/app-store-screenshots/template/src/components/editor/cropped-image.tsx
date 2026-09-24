"use client";
import { img } from "@/lib/image-cache";
import { resolveScreenshot } from "@/lib/locale";
import { DEFAULT_CROP } from "@/lib/template-layout";
import type { ImageAsset, Theme } from "@/lib/types";

export function CroppedImage({ asset, locale, label, hideEmpty, theme }: {
  asset?: ImageAsset; locale: string; label: string; hideEmpty?: boolean; theme: Theme;
}) {
  const src = img(resolveScreenshot(asset?.src, locale));
  const crop = asset?.crop || DEFAULT_CROP;
  return <div data-image-role={label} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", pointerEvents: "none", userSelect: "none" }}>
    {src ? <img src={src} alt="" draggable={false} style={{
      display: "block", width: "100%", height: "100%", objectFit: "cover",
      objectPosition: `${crop.x}% ${crop.y}%`, transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%`,
    }} /> : !hideEmpty ? <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      border: `2px dashed ${theme.muted}`, color: theme.fg, background: theme.bg,
      padding: "8%", fontSize: 28, textAlign: "center", fontFamily: theme.fontFamily,
    }}>Add {label.toLowerCase()}</div> : null}
  </div>;
}
