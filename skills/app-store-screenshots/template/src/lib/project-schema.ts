import { z } from "zod";

const device = z.enum(["iphone", "ipad", "android", "android-7", "android-10", "feature-graphic"]);
const locale = z.string().max(35).regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/);
const text = z.record(locale, z.string().max(4000)).refine((value) => Object.keys(value).length <= 32);
const transform = z.object({
  x: z.number().min(-100000).max(100000), y: z.number().min(-100000).max(100000),
  width: z.number().positive().max(100000), height: z.number().positive().max(100000),
  rotation: z.number().min(-36000).max(36000).optional(), zIndex: z.number().int().min(-1000).max(1000).optional(),
});
const image = z.string().max(4 * 1024 * 1024).refine((value) => {
  if (value === "" || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(value)) return true;
  if (!value.startsWith("/") || value.includes("\\")) return false;
  try { return new URL(value, "http://editor.invalid").origin === "http://editor.invalid"; } catch { return false; }
}, "Use a local image path or PNG/JPEG data URL");
const slide = z.object({
  id: z.string().min(1).max(100),
  layout: z.enum(["hero", "device-bottom", "device-top", "two-devices", "no-device", "split-landscape", "feature-graphic"]),
  label: text, headline: text, screenshot: image, screenshotSecondary: image.optional(), inverted: z.boolean().optional(),
  transforms: z.object({ caption: transform.optional(), device: transform.optional(), deviceSecondary: transform.optional() }).optional(),
  textElements: z.array(z.object({
    id: z.string().min(1).max(100), text, transform, fontSize: z.number().positive().max(2000).optional(),
    fontWeight: z.number().min(1).max(1000).optional(), color: z.string().max(100).optional(), align: z.enum(["left", "center", "right"]).optional(),
  })).max(50).optional(),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(2), appName: z.string().max(200), themeId: z.string().min(1).max(100), connectedCanvas: z.boolean(),
  locales: z.array(locale).min(1).max(32), locale, device, orientation: z.enum(["portrait", "landscape"]),
  slidesByDevice: z.record(device, z.array(slide).max(50)), appIcon: image.optional(),
}).refine((project) => project.locales.includes(project.locale), "Active locale must be in locales");
