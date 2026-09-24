"use client";
import { gradientCss } from "@/lib/background";
import { img } from "@/lib/image-cache";
import { resolveScreenshot } from "@/lib/locale";
import { DEFAULT_CROP } from "@/lib/template-layout";
import type { Background } from "@/lib/types";

export function BackgroundLayer({ background, locale }: { background: Background; locale: string }) {
  const crop = background.kind === "image" ? background.image.crop ?? DEFAULT_CROP : DEFAULT_CROP;
  const src = background.kind === "image" ? img(resolveScreenshot(background.image.src, locale)) : "";
  return <div data-background-kind={background.kind} aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", userSelect: "none",
    background: background.kind === "gradient" ? gradientCss(background) : background.color,
  }}>
    {background.kind === "image" && <>
      {src && <img data-background-image src={src} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: background.fit, objectPosition: `${crop.x}% ${crop.y}%`,
        transform: `scale(${background.fit === "cover" ? crop.zoom : 1})`, transformOrigin: `${crop.x}% ${crop.y}%`,
      }} />}
      <div style={{ position: "absolute", inset: 0, background: background.tint.color, opacity: background.tint.opacity / 100 }} />
    </>}
  </div>;
}
