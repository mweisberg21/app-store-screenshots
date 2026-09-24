"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BRAND_FONTS, brandForProject, contrastRatio } from "@/lib/brand";
import type { BrandStyle, ProjectState } from "@/lib/types";
import { ScreenshotPicker } from "./screenshot-picker";

export function BrandSettings({ state, onApply, disabled }: {
  state: ProjectState; onApply: (brand: BrandStyle, appIcon: string) => void; disabled: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<BrandStyle>(() => brandForProject(state));
  const [icon, setIcon] = React.useState(state.appIcon || "");
  const colors = ["background", "foreground"] as const;
  const valid = colors.every((key) => /^#[0-9a-fA-F]{6}$/.test(draft[key]));
  const contrast = valid ? contrastRatio(draft.background, draft.foreground) : 0;
  return <>
    <Button variant="outline" onClick={() => { setDraft(brandForProject(state)); setIcon(state.appIcon || ""); setOpen(true); }} disabled={disabled}>Brand</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customer brand</DialogTitle>
          <DialogDescription>Use colors and type from the customer’s app or brand guide. These settings apply to every device and language.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {colors.map((key) => <div key={key} className="space-y-2">
              <Label htmlFor={`brand-${key}`} className="capitalize">{key === "foreground" ? "Text" : key}</Label>
              <div className="h-10 rounded border" style={{ background: /^#[0-9a-fA-F]{6}$/.test(draft[key]) ? draft[key] : "transparent" }} aria-hidden />
              <Input id={`brand-${key}`} aria-label={`Brand ${key}`} value={draft[key]} maxLength={7} spellCheck={false}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="font-mono text-xs" />
            </div>)}
          </div>
          <p className="text-xs text-muted-foreground">Use six-digit hex colors from the customer’s brand guide.</p>
          <ScreenshotPicker label="App icon" value={icon} onChange={setIcon} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-font">Headline type</Label>
              <select id="brand-font" className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" value={draft.font}
                onChange={(e) => setDraft({ ...draft, font: e.target.value as BrandStyle["font"] })}>
                {Object.entries(BRAND_FONTS).map(([id, font]) => <option key={id} value={id}>{font.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-alignment">Headline alignment</Label>
              <select id="brand-alignment" className="h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" value={draft.alignment}
                onChange={(e) => setDraft({ ...draft, alignment: e.target.value as BrandStyle["alignment"] })}>
                <option value="left">Left</option><option value="center">Center</option>
              </select>
            </div>
          </div>
          <div className="flex min-h-36 items-center rounded border p-6" style={{ background: valid ? draft.background : undefined, color: valid ? draft.foreground : undefined, fontFamily: BRAND_FONTS[draft.font].family, textAlign: draft.alignment }}>
            <p className="w-full text-3xl font-semibold leading-tight">{state.appName || "Your customer’s app"}</p>
          </div>
          <p role="status" className="text-sm tabular-nums">{valid ? `Text contrast ${contrast.toFixed(1)}:1${contrast < 4.5 ? " — increase to at least 4.5:1 before export." : ""}` : "Enter a valid hex color in each field."}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={() => { onApply(draft, icon); setOpen(false); }}>Apply brand</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
