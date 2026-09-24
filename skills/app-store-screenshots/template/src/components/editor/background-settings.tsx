"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { backgroundContrast, backgroundText, effectiveBackground, gradientCss, GRADIENT_PRESETS, mixColor } from "@/lib/background";
import { projectTheme } from "@/lib/brand";
import { didFail, preloadImages } from "@/lib/image-cache";
import { resolveScreenshot } from "@/lib/locale";
import { backgroundSchema } from "@/lib/project-schema";
import { DEFAULT_CROP } from "@/lib/template-layout";
import type { Background, GradientBackground, ProjectState, Slide } from "@/lib/types";
import { ScreenshotPicker } from "./screenshot-picker";
import { getCanvas, SlideCanvas } from "./slide-canvas";

type Scope = "project" | "slide";
type Kind = Background["kind"];
type Draft = { selected: Kind; values: Record<Kind, Background> };

function makeDraft(background: Background, text: string): Draft {
  const color = background.kind === "gradient" ? background.stops[0].color : background.color;
  return { selected: background.kind, values: {
    solid: { kind: "solid", color, textColor: text },
    gradient: { kind: "gradient", style: "linear", angle: 150, center: { x: 50, y: 50 }, stops: [{ color, position: 0 }, { color: mixColor(color, "#808080", 0.25), position: 100 }], textColor: text },
    image: { kind: "image", image: { src: "", crop: { ...DEFAULT_CROP } }, fit: "cover", color, tint: { color: "#000000", opacity: 0 }, textColor: text },
    [background.kind]: { ...background, textColor: background.textColor ?? text },
  } };
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = React.useId();
  return <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <input type="color" aria-label={`${label} color picker`} value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#FFFFFF"} onChange={e => onChange(e.target.value)} className="h-11 w-11 shrink-0 cursor-pointer rounded-md border bg-background p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
      <Input id={id} value={value} maxLength={7} spellCheck={false} onChange={e => onChange(e.target.value)} className="h-11 font-mono text-sm" />
    </div>
  </div>;
}

function Range({ label, value, min = 0, max = 100, step = 1, unit = "%", onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void;
}) {
  const id = React.useId();
  return <div>
    <div className="grid min-h-8 grid-cols-[1fr_auto] items-start gap-3"><Label htmlFor={id}>{label}</Label><output htmlFor={id} className="text-xs tabular-nums text-muted-foreground">{Number(value.toFixed(2))}{unit}</output></div>
    <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="h-10 w-full cursor-pointer accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
  </div>;
}

function BackgroundPreview({ state, slide, background }: { state: ProjectState; slide: Slide; background: Background }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const { cW, cH } = getCanvas(state.device, state.orientation);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    setWidth(element.clientWidth); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="flex min-h-64 flex-col items-center gap-4 bg-muted/40 p-6 lg:sticky lg:top-0 lg:self-start">
    <p className="w-full text-xs font-medium text-muted-foreground">Preview of this background</p>
    <div ref={ref} data-background-preview className="relative w-full overflow-hidden border" style={{ maxWidth: Math.min(360, 480 * cW / cH), aspectRatio: `${cW} / ${cH}` }}>
      {width > 0 && <div style={{ width: cW, height: cH, transform: `scale(${width / cW})`, transformOrigin: "top left" }}>
        <SlideCanvas slide={{ ...slide, background }} device={state.device} orientation={state.orientation} theme={projectTheme(state)} locale={state.locale} appName={state.appName} appIcon={state.appIcon} />
      </div>}
    </div>
    <p className="max-w-72 text-center text-xs leading-relaxed text-muted-foreground">Check the headline and app content at this size before export.</p>
  </div>;
}

export function BackgroundSettings({ state, slide, disabled, onApply }: {
  state: ProjectState; slide: Slide | null; disabled: boolean;
  onApply: (scope: Scope, background: Background | undefined, replaceOverrides: boolean) => void;
}) {
  const theme = projectTheme(state);
  const base = { kind: "solid", color: theme.bg, textColor: theme.fg } as const;
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState<Scope>("project");
  const [drafts, setDrafts] = React.useState<Record<Scope, Draft>>({ project: makeDraft(base, theme.fg), slide: makeDraft(base, theme.fg) });
  const [replaceOverrides, setReplaceOverrides] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [loadedSource, setLoadedSource] = React.useState("");
  const [imageError, setImageError] = React.useState(false);
  const current = drafts[scope];
  const draft = current.values[current.selected];
  const valid = backgroundSchema.safeParse(draft).success;
  const imageSource = draft.kind === "image" ? resolveScreenshot(draft.image.src, state.locale) : "";
  React.useEffect(() => {
    if (!open || !imageSource) return;
    let cancelled = false;
    setImageError(false);
    void preloadImages([imageSource], { retryFailed: true }).then(() => {
      if (!cancelled) { setLoadedSource(imageSource); setImageError(didFail(imageSource)); }
    });
    return () => { cancelled = true; };
  }, [open, imageSource]);
  const imageReady = draft.kind !== "image" || (!!imageSource && loadedSource === imageSource && !imageError);
  const text = draft.textColor ?? theme.fg;
  const contrast = valid ? backgroundContrast(draft, text) : null;
  const overrides = Object.values(state.slidesByDevice).flat().filter(item => item.background).length;

  function update(next: Background) {
    setDrafts(prev => ({ ...prev, [scope]: { selected: next.kind, values: { ...prev[scope].values, [next.kind]: next } } }));
  }
  function updateStop(index: number, patch: Partial<GradientBackground["stops"][number]>) {
    if (draft.kind === "gradient") update({ ...draft, stops: draft.stops.map((stop, i) => i === index ? { ...stop, ...patch } : stop) });
  }

  return <>
    <Button variant="outline" disabled={disabled || !slide} onClick={() => {
      if (!slide) return;
      setDrafts({ project: makeDraft(state.background ?? base, theme.fg), slide: makeDraft(effectiveBackground(slide, theme), backgroundText(slide, theme)) });
      setScope(slide.background ? "slide" : "project"); setReplaceOverrides(false); setLoadedSource(""); setImageError(false); setOpen(true);
    }}>Background</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-32px)] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="px-6 pb-5 pt-6">
          <DialogTitle>Background</DialogTitle>
          <DialogDescription>Set the color and image behind your app. Preview each change before you apply it.</DialogDescription>
        </DialogHeader>
        <div className="grid border-y lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {slide && <BackgroundPreview state={state} slide={slide} background={valid ? draft : base} />}
          <div className="min-w-0 space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="background-scope">Apply to</Label>
              <select id="background-scope" value={scope} disabled={uploading} onChange={e => setScope(e.target.value as Scope)} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2">
                <option value="project">Project default · all devices</option><option value="slide">This screen only</option>
              </select>
              {scope === "project" && overrides > 0 && <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs leading-relaxed"><input type="checkbox" checked={replaceOverrides} onChange={e => setReplaceOverrides(e.target.checked)} className="h-4 w-4 accent-foreground" />Replace {overrides} screen override{overrides === 1 ? "" : "s"}</label>}
              {scope === "project" && overrides > 0 && !replaceOverrides && <p className="text-xs text-muted-foreground">Screens with their own background will keep it.</p>}
            </div>
            <div role="group" aria-label="Background type" className="grid grid-cols-3 gap-1 rounded-lg border p-1">
              {(["solid", "gradient", "image"] as const).map(kind => <button type="button" key={kind} disabled={uploading} aria-pressed={draft.kind === kind} onClick={() => setDrafts(prev => ({ ...prev, [scope]: { ...prev[scope], selected: kind } }))} className={`h-11 rounded-md text-sm font-medium capitalize transition-colors focus-visible:outline focus-visible:outline-2 ${draft.kind === kind ? "bg-foreground text-background" : "hover:bg-muted"}`}>{kind === "image" ? "Image" : kind === "solid" ? "Solid" : "Gradient"}</button>)}
            </div>
            {draft.kind === "solid" && <div className="space-y-4">
              <ColorField label="Solid color" value={draft.color} onChange={color => update({ ...draft, color })} />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Solid color swatches">
                {[...new Set([theme.bg, theme.fg, "#FFFFFF", "#F5F0E8", "#DCE6DF", "#202020"])].map(color => <button type="button" key={color} aria-label={`Use solid ${color}`} title={color} onClick={() => update({ ...draft, color })} className="h-11 w-11 rounded-md border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ background: color }} />)}
              </div>
            </div>}
            {draft.kind === "gradient" && <div className="space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map(preset => {
                  const background: GradientBackground = { ...draft, textColor: preset.text, stops: preset.colors.map((color, i) => ({ color, position: i * 100 / (preset.colors.length - 1) })) };
                  return <button key={preset.name} type="button" aria-label={`Use ${preset.name} gradient`} onClick={() => update(background)} className="rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="mb-1 block h-11 rounded-md border" style={{ background: gradientCss(background) }} /><span className="text-[11px] text-muted-foreground">{preset.name}</span></button>;
                })}
              </div>
              <div className="space-y-2"><Label htmlFor="gradient-style">Gradient shape</Label><select id="gradient-style" value={draft.style} onChange={e => update({ ...draft, style: e.target.value as GradientBackground["style"] })} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2"><option value="linear">Linear</option><option value="radial">Radial</option></select></div>
              {draft.style === "linear" ? <Range label="Gradient angle" value={draft.angle} max={360} unit="°" onChange={angle => update({ ...draft, angle })} /> : <div className="grid grid-cols-2 gap-4"><Range label="Gradient center X" value={draft.center.x} onChange={x => update({ ...draft, center: { ...draft.center, x } })} /><Range label="Gradient center Y" value={draft.center.y} onChange={y => update({ ...draft, center: { ...draft.center, y } })} /></div>}
              <div className="space-y-4">
                {draft.stops.map((stop, i) => <div key={i} className="space-y-1 border-b pb-3 last:border-0">
                  <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><ColorField label={`Stop ${i + 1} color`} value={stop.color} onChange={color => updateStop(i, { color })} /></div><Button variant="ghost" className="h-11 px-2" aria-label={`Remove stop ${i + 1}`} disabled={draft.stops.length <= 2} onClick={() => update({ ...draft, stops: draft.stops.filter((_, index) => index !== i) })}>Remove</Button></div>
                  <Range label={`Stop ${i + 1} position`} value={stop.position} onChange={position => updateStop(i, { position })} />
                </div>)}
                <div className="flex gap-2"><Button variant="outline" disabled={draft.stops.length >= 5 || !valid} onClick={() => {
                  const sorted = [...draft.stops].sort((a, b) => a.position - b.position);
                  let index = 1;
                  for (let i = 2; i < sorted.length; i++) if (sorted[i].position - sorted[i - 1].position > sorted[index].position - sorted[index - 1].position) index = i;
                  update({ ...draft, stops: [...draft.stops, { color: mixColor(sorted[index - 1].color, sorted[index].color, 0.5), position: (sorted[index - 1].position + sorted[index].position) / 2 }].sort((a, b) => a.position - b.position) });
                }}>Add color stop</Button><Button variant="ghost" onClick={() => {
                  const sorted = [...draft.stops].sort((a, b) => a.position - b.position);
                  update({ ...draft, stops: sorted.reverse().map(stop => ({ ...stop, position: 100 - stop.position })) });
                }}>Reverse</Button></div>
              </div>
            </div>}
            {draft.kind === "image" && <div className="space-y-5">
              <ScreenshotPicker label="Background image" value={draft.image.src} locale={state.locale} onBusyChange={setUploading} onChange={src => setDrafts(prev => {
                const image = prev[scope].values.image;
                if (image.kind !== "image") return prev;
                return { ...prev, [scope]: { ...prev[scope], values: { ...prev[scope].values, image: { ...image, image: { ...image.image, src } } } } };
              })} />
              <div className="space-y-2"><Label htmlFor="background-image-fit">Image size</Label><select id="background-image-fit" value={draft.fit} onChange={e => update({ ...draft, fit: e.target.value as "cover" | "contain" })} className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2"><option value="cover">Fill · crop to the screen</option><option value="contain">Fit · show the whole image</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <Range label="Image horizontal position" value={draft.image.crop?.x ?? 50} onChange={x => update({ ...draft, image: { ...draft.image, crop: { ...(draft.image.crop ?? DEFAULT_CROP), x } } })} />
                <Range label="Image vertical position" value={draft.image.crop?.y ?? 50} onChange={y => update({ ...draft, image: { ...draft.image, crop: { ...(draft.image.crop ?? DEFAULT_CROP), y } } })} />
              </div>
              {draft.fit === "cover" && <Range label="Image zoom" min={1} max={3} step={0.05} unit="×" value={draft.image.crop?.zoom ?? 1} onChange={zoom => update({ ...draft, image: { ...draft.image, crop: { ...(draft.image.crop ?? DEFAULT_CROP), zoom } } })} />}
              <Button variant="outline" onClick={() => update({ ...draft, image: { ...draft.image, crop: { ...DEFAULT_CROP } } })}>Reset image position</Button>
              <ColorField label="Image base color" value={draft.color} onChange={color => update({ ...draft, color })} />
              <ColorField label="Image tint" value={draft.tint.color} onChange={color => update({ ...draft, tint: { ...draft.tint, color } })} />
              <Range label="Tint strength" value={draft.tint.opacity} onChange={opacity => update({ ...draft, tint: { ...draft.tint, opacity } })} />
            </div>}
            <ColorField label="Background text color" value={text} onChange={textColor => update({ ...draft, textColor })} />
            <p role="status" className="text-xs leading-relaxed text-muted-foreground tabular-nums">{!valid ? "Use six-digit hex colors and values within the control limits." : imageError ? "The background image could not load. Replace it before applying." : draft.kind === "image" ? !imageSource ? "Choose a PNG or JPG image, up to 8 MB." : !imageReady ? "Loading image…" : "Image contrast varies. Adjust the tint and check the headline in the preview." : `Lowest sampled text contrast: ${contrast?.toFixed(1)}:1.${contrast !== null && contrast < 4.5 ? " Increase to 4.5:1 before export." : ""}`}</p>
          </div>
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 bg-background px-6 py-4">
          <Button variant="ghost" disabled={uploading} onClick={() => { onApply(scope, undefined, replaceOverrides); setOpen(false); }}>{scope === "slide" ? "Use project background" : "Use brand background"}</Button>
          <div className="flex gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!valid || !imageReady || uploading} onClick={() => { onApply(scope, draft, replaceOverrides); setOpen(false); }}>Apply background</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
