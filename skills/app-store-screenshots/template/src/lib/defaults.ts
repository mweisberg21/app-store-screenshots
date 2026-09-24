import starter from "./starter-project.json";
import type { Device, ProjectState, Slide } from "./types";

let _id = 0;
export const nid = () => `s_${Date.now().toString(36)}_${(_id++).toString(36)}`;

// The checked-in starter is also used by Reset. Placeholders are editor guidance,
// never marketing copy saved in a customer project.
export const DEFAULT_PROJECT = starter as ProjectState;

export function newSlide(layout: Slide["layout"] = "device-bottom"): Slide {
  return { id: nid(), layout, label: {}, headline: {}, screenshot: "" };
}

export function detectPlatform(device: Device): "ios" | "android" {
  return device === "iphone" || device === "ipad" ? "ios" : "android";
}
