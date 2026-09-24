export async function createContactSheet(appName: string, locale: string, shots: string[]): Promise<string> {
  const images = await Promise.all(shots.map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the review sheet"));
    image.src = src;
  })));
  if (!images.length) throw new Error("No images for the review sheet");
  const columns = Math.min(4, images.length);
  const width = 280;
  const height = Math.round(width * images[0].height / images[0].width);
  const gap = 24;
  const top = 90;
  const canvas = document.createElement("canvas");
  canvas.width = columns * (width + gap) + gap;
  canvas.height = top + Math.ceil(images.length / columns) * (height + 48) + gap;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Review sheet drawing is unavailable");
  ctx.fillStyle = "#f2f2f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#202020";
  ctx.font = "600 22px -apple-system, sans-serif";
  ctx.fillText(appName, gap, 34, canvas.width - gap * 2);
  ctx.font = "14px -apple-system, sans-serif";
  ctx.fillText(`${locale.toUpperCase()} · Review copy · Use the separate images for store upload`, gap, 60, canvas.width - gap * 2);
  images.forEach((image, index) => {
    const x = gap + index % columns * (width + gap);
    const y = top + Math.floor(index / columns) * (height + 48);
    ctx.drawImage(image, x, y, width, height);
    ctx.fillText(String(index + 1).padStart(2, "0"), x, y + height + 24);
  });
  return canvas.toDataURL("image/png");
}
