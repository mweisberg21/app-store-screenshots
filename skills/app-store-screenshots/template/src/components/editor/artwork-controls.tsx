"use client";
import { Button } from "@/components/ui/button";
import { DEFAULT_CROP } from "@/lib/template-layout";
import type { ImageAsset, ImageCrop, Slide } from "@/lib/types";
import { ScreenshotPicker } from "./screenshot-picker";

export function ArtworkControls({ slide, locale, onChange }: {
  slide: Slide; locale: string; onChange: (patch: Partial<Slide>) => void;
}) {
  if (slide.layout === "creator") {
    return <section className="space-y-3 border-t pt-4" aria-label="Creator photo settings">
      <h3 className="text-xs font-semibold">Creator photo</h3>
      <p className="text-xs text-muted-foreground">Use an approved photo. Keep faces inside the frame and clear of the app view.</p>
      <AssetControl label="Creator photo" asset={slide.photo || { src: "" }} locale={locale} onChange={(photo) => onChange({ photo })} />
    </section>;
  }
  if (slide.layout !== "content-library") return null;
  const artworks = slide.artworks || [];
  function update(index: number, asset: ImageAsset) {
    const next = [...artworks];
    while (next.length <= index) next.push({ src: "" });
    next[index] = asset;
    onChange({ artworks: next });
  }
  return <section className="space-y-4 border-t pt-4" aria-label="Catalog image settings">
    <div className="space-y-1">
      <h3 className="text-xs font-semibold">Catalog images</h3>
      <p className="text-xs text-muted-foreground">Use two to four approved images from the customer's catalog. Check titles after cropping.</p>
    </div>
    {Array.from({ length: Math.max(2, artworks.length) }, (_, index) => <div key={index} className="space-y-2">
      <AssetControl label={`Catalog image ${index + 1}`} asset={artworks[index] || { src: "" }} locale={locale} onChange={(asset) => update(index, asset)} />
      {artworks.length > 2 && <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ artworks: artworks.filter((_, i) => i !== index) })}>Remove catalog image {index + 1}</Button>}
    </div>)}
    {artworks.length < 4 && <Button type="button" variant="outline" className="w-full" onClick={() => {
      const next = [...artworks];
      while (next.length < 2) next.push({ src: "" });
      onChange({ artworks: [...next, { src: "" }] });
    }}>Add catalog image</Button>}
  </section>;
}

function AssetControl({ label, asset, locale, onChange }: {
  label: string; asset: ImageAsset; locale: string; onChange: (asset: ImageAsset) => void;
}) {
  const crop = asset.crop || DEFAULT_CROP;
  const controls: { key: keyof ImageCrop; name: string; min: number; max: number; step: number }[] = [
    { key: "x", name: "Horizontal crop", min: 0, max: 100, step: 1 },
    { key: "y", name: "Vertical crop", min: 0, max: 100, step: 1 },
    { key: "zoom", name: "Zoom", min: 1, max: 3, step: 0.05 },
  ];
  return <div className="space-y-2">
    <ScreenshotPicker label={label} value={asset.src} locale={locale} onChange={(src) => onChange({ src, crop: DEFAULT_CROP })} />
    {asset.src && <div className="space-y-1">
      {controls.map(({ key, name, min, max, step }) => <label key={key} className="block text-xs">
        <span className="flex justify-between gap-3 text-muted-foreground"><span>{name}</span><span className="tabular-nums">{key === "zoom" ? `${crop[key].toFixed(2)}×` : `${crop[key]}%`}</span></span>
        <input type="range" className="h-11 w-full accent-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-500 md:h-10" aria-label={`${label} ${name.toLowerCase()}`} min={min} max={max} step={step} value={crop[key]} onChange={(event) => onChange({ ...asset, crop: { ...crop, [key]: Number(event.target.value) } })} />
      </label>)}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...asset, crop: DEFAULT_CROP })} aria-label={`Reset ${label.toLowerCase()} crop`}>Reset crop</Button>
    </div>}
  </div>;
}
