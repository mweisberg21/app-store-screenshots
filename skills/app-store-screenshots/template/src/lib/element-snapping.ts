import type { ElementTransform } from "./types";
export function snapPosition(
  rect: ElementTransform,
  targets: { x: number[]; y: number[] },
  threshold: number,
) {
  const result = {
    x: rect.x,
    y: rect.y,
    guides: {} as { x?: number; y?: number },
  };
  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? rect.width : rect.height;
    let distance = threshold + 1,
      delta = 0,
      line: number | undefined;
    for (const target of targets[axis])
      for (const offset of [0, size / 2, size]) {
        const change = target - (rect[axis] + offset);
        if (Math.abs(change) < distance) {
          distance = Math.abs(change);
          delta = change;
          line = target;
        }
      }
    if (distance <= threshold) {
      result[axis] += delta;
      result.guides[axis] = line;
    }
  }
  return result;
}
