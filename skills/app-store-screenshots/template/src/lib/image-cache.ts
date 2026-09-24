"use client";
// Pre-loads images as base64 data URIs so html-to-image exports without
// non-deterministic image fetch races. Always use img(path) in render.

const cache = new Map<string, string>();
const failed = new Set<string>();
const sizes = new Map<string, { width: number; height: number }>();

async function decodedSize(data: string): Promise<{ width: number; height: number }> {
  const image = new Image();
  image.src = data;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("Empty image");
  return { width: image.naturalWidth, height: image.naturalHeight };
}

async function fetchAsDataUrl(path: string): Promise<string | null> {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function preloadImages(
  paths: string[],
  options: { retryFailed?: boolean } = {},
): Promise<void> {
  await Promise.all(
    paths
      .filter(Boolean)
      .filter((p) => (!cache.has(p) || !sizes.has(p)) && (options.retryFailed || !failed.has(p)))
      .map(async (p) => {
        const data = cache.get(p) || (p.startsWith("data:") ? p : await fetchAsDataUrl(p));
        try {
          if (!data) throw new Error("Image not found");
          sizes.set(p, await decodedSize(data));
          cache.set(p, data);
          failed.delete(p);
        } catch {
          cache.delete(p);
          sizes.delete(p);
          failed.add(p);
        }
      }),
  );
}

export function img(path: string | undefined): string {
  if (!path) return "";
  if (failed.has(path)) return "";
  if (path.startsWith("data:")) return path;
  return cache.get(path) || path;
}

export function setImage(path: string, dataUrl: string) {
  cache.set(path, dataUrl);
  sizes.delete(path);
  failed.delete(path);
}

export function didFail(path: string | undefined): boolean {
  if (!path) return false;
  return failed.has(path);
}

export function imageSize(path: string) {
  return sizes.get(path);
}
