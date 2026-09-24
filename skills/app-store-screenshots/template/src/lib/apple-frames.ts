import frames from "./apple-frames.json";
import type { Device, Orientation } from "./types";

export const APPLE_FRAMES = frames;
export type AppleFrame = (typeof frames)[keyof typeof frames];

export function appleFrame(device: Device, orientation: Orientation): AppleFrame | undefined {
  if (device === "iphone") return frames["iphone-17-pro-max"];
  if (device === "ipad") return frames[orientation === "landscape" ? "ipad-pro-13-landscape" : "ipad-pro-13-portrait"];
}

export function framePath(frame: AppleFrame): string {
  return `/api/device-frames/${frame.filename}`;
}

// Older decks can contain a saved box with different device proportions.
// Fit the original product inside that box without moving its center.
export function fitFrameRect(rect: { x: number; y: number; width: number; height: number }, aspect: number) {
  const width = Math.min(rect.width, rect.height * aspect);
  const height = width / aspect;
  return { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
}
