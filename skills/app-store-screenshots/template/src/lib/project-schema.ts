import { z } from "zod";

const device = z.enum([
  "iphone",
  "ipad",
  "android",
  "android-7",
  "android-10",
  "feature-graphic",
]);
const locale = z
  .string()
  .max(35)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/);
const text = z
  .record(locale, z.string().max(4000))
  .refine((value) => Object.keys(value).length <= 32);
const transform = z.object({
  x: z.number().min(-100000).max(100000),
  y: z.number().min(-100000).max(100000),
  width: z.number().positive().max(100000),
  height: z.number().positive().max(100000),
  rotation: z.number().min(-36000).max(36000).optional(),
  zIndex: z.number().int().min(-1000).max(1000).optional(),
});
const image = z
  .string()
  .max(4 * 1024 * 1024)
  .refine((value) => {
    if (
      value === "" ||
      /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(value)
    )
      return true;
    if (!value.startsWith("/") || value.includes("\\")) return false;
    try {
      return (
        new URL(value, "http://editor.invalid").origin ===
        "http://editor.invalid"
      );
    } catch {
      return false;
    }
  }, "Use a local image path or PNG/JPEG data URL");
const imageAsset = z.object({
  src: image,
  crop: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      zoom: z.number().min(1).max(3),
    })
    .optional(),
});
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const percent = z.number().min(0).max(100);
export const backgroundSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("solid"), color, textColor: color.optional() }),
  z.object({
    kind: z.literal("gradient"),
    textColor: color.optional(),
    style: z.enum(["linear", "radial"]),
    angle: z.number().min(0).max(360),
    center: z.object({ x: percent, y: percent }),
    stops: z
      .array(z.object({ color, position: percent }))
      .min(2)
      .max(5),
  }),
  z.object({
    kind: z.literal("image"),
    textColor: color.optional(),
    image: imageAsset,
    fit: z.enum(["cover", "contain"]),
    color,
    tint: z.object({ color, opacity: percent }),
  }),
]);
const elementBase = {
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  transform,
  groupId: z.string().min(1).max(100).optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  opacity: percent,
};
const elementAsset = z.object({
  src: image,
  crop: z
    .object({ x: percent, y: percent, zoom: z.number().min(1).max(8) })
    .optional(),
});
const radius = z.number().min(0).max(2000);
const elementImage = {
  ...elementBase,
  asset: elementAsset,
  fit: z.enum(["cover", "contain"]),
  radius,
  lockAspect: z.boolean(),
};
export const canvasElementSchema = z.discriminatedUnion("kind", [
  z.object({
    ...elementBase,
    kind: z.literal("text"),
    text,
    fontSize: z.number().min(8).max(2000),
    fontWeight: z.number().min(100).max(900),
    color,
    align: z.enum(["left", "center", "right"]),
  }),
  z.object({ ...elementImage, kind: z.literal("image") }),
  z.object({ ...elementImage, kind: z.literal("logo") }),
  z.object({ ...elementImage, kind: z.literal("detail") }),
  z.object({
    ...elementBase,
    kind: z.literal("device"),
    device: z.enum(["iphone", "ipad", "android", "android-7", "android-10"]),
    orientation: z.enum(["portrait", "landscape"]),
    src: image,
  }),
  z.object({
    ...elementBase,
    kind: z.literal("cards"),
    items: z
      .array(z.object({ asset: elementAsset, title: text }))
      .min(2)
      .max(6),
    layout: z.enum(["row", "column", "grid"]),
    gap: z.number().min(0).max(300),
    radius,
    color,
    fontSize: z.number().min(8).max(1000),
  }),
  z.object({
    ...elementBase,
    kind: z.literal("shape"),
    shape: z.enum(["rectangle", "ellipse"]),
    fill: color,
    stroke: color,
    strokeWidth: z.number().min(0).max(100),
    radius,
  }),
  z.object({
    ...elementBase,
    kind: z.literal("line"),
    color,
    thickness: z.number().min(1).max(100),
    arrow: z.boolean(),
    dashed: z.boolean(),
  }),
  z.object({
    ...elementBase,
    kind: z.literal("icon"),
    icon: z.enum([
      "play",
      "calendar",
      "community",
      "heart",
      "book",
      "check",
      "cast",
      "clock",
    ]),
    color,
    strokeWidth: z.number().min(0.5).max(4),
  }),
]);
const elementList = z
  .array(canvasElementSchema)
  .max(50)
  .refine(
    (items) => new Set(items.map((e) => e.id)).size === items.length,
    "Element IDs must be unique",
  );
const slide = z.object({
  id: z.string().min(1).max(100),
  layout: z.enum([
    "hero",
    "device-bottom",
    "creator",
    "content-library",
    "device-top",
    "two-devices",
    "no-device",
    "split-landscape",
    "feature-graphic",
  ]),
  label: text,
  headline: text,
  screenshot: image,
  screenshotSecondary: image.optional(),
  inverted: z.boolean().optional(),
  photo: imageAsset.optional(),
  artworks: z.array(imageAsset).max(4).optional(),
  background: backgroundSchema.optional(),
  elements: elementList.optional(),
  transforms: z
    .object({
      caption: transform.optional(),
      device: transform.optional(),
      deviceSecondary: transform.optional(),
    })
    .optional(),
  textElements: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        text,
        transform,
        fontSize: z.number().positive().max(2000).optional(),
        fontWeight: z.number().min(1).max(1000).optional(),
        color: z.string().max(100).optional(),
        align: z.enum(["left", "center", "right"]).optional(),
      }),
    )
    .max(50)
    .optional(),
});

export const projectSchema = z
  .object({
    schemaVersion: z.literal(2),
    appName: z.string().max(200),
    themeId: z.string().min(1).max(100),
    connectedCanvas: z.boolean(),
    brand: z
      .object({
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        font: z.enum(["sans", "serif", "humanist"]),
        alignment: z.enum(["left", "center"]),
      })
      .optional(),
    background: backgroundSchema.optional(),
    assets: z
      .array(
        z.object({
          id: z.string().min(1).max(200),
          name: z.string().min(1).max(200),
          src: image,
          category: z.enum(["logo", "photo", "screenshot", "cover"]),
        }),
      )
      .max(200)
      .optional(),
    savedGroups: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().min(1).max(100),
          width: z.number().positive().max(100000),
          height: z.number().positive().max(100000),
          elements: elementList.refine((items) => items.length > 0),
        }),
      )
      .max(30)
      .optional(),
    locales: z.array(locale).min(1).max(32),
    locale,
    device,
    orientation: z.enum(["portrait", "landscape"]),
    slidesByDevice: z.record(device, z.array(slide).max(50)),
    appIcon: image.optional(),
  })
  .refine(
    (project) => project.locales.includes(project.locale),
    "Active locale must be in locales",
  );
