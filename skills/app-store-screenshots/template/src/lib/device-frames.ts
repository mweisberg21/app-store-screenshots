import { APPLE_FRAMES, appleFrame } from "./apple-frames";
import androidFrames from "./android-frames.json";
import type { Device, Orientation } from "./types";

export { fitFrameRect, framePath } from "./apple-frames";
export const DEVICE_FRAMES = { ...APPLE_FRAMES, ...androidFrames };
export type DeviceFrame = (typeof DEVICE_FRAMES)[keyof typeof DEVICE_FRAMES];

export function deviceFrame(device: Device, orientation: Orientation): DeviceFrame | undefined {
  if (device === "android") return androidFrames["samsung-galaxy-s22"];
  return appleFrame(device, orientation);
}

export function deviceFrameAspect(device: Device, orientation: Orientation): number {
  const frame = deviceFrame(device, orientation);
  if (frame) return frame.width / frame.height;
  if (device === "android-7" || device === "android-10") return orientation === "landscape" ? 8 / 5 : 5 / 8;
  return 1;
}
