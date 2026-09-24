"use client";
import * as React from "react";
import { ImagePlus, Search, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { nid } from "@/lib/defaults";
import { img } from "@/lib/image-cache";
import { resolveScreenshot } from "@/lib/locale";
import type { ProjectAsset } from "@/lib/types";
import { AssetContext } from "./asset-context";
import { uploadImageFile } from "./screenshot-picker";

export function AssetLibrary({
  locale,
  onPick,
}: {
  locale: string;
  onPick?: (asset: ProjectAsset) => void;
}) {
  const library = React.useContext(AssetContext),
    input = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState(""),
    [category, setCategory] = React.useState("all"),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState("");
  const [renaming, setRenaming] = React.useState<ProjectAsset | null>(null),
    [name, setName] = React.useState(""),
    [assetCategory, setAssetCategory] =
      React.useState<ProjectAsset["category"]>("photo");
  const assets = library.assets.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      a.name.toLowerCase().includes(search.toLowerCase()),
  );
  async function upload(files: FileList | null) {
    if (!files || busy) return;
    setBusy(true);
    setError("");
    try {
      if (library.assets.length + files.length > 200)
        throw new Error(
          "The library can hold 200 images. Upload fewer files or remove unused assets.",
        );
      for (const file of Array.from(files)) {
        if (library.assets.length >= 200)
          throw new Error(
            "This library is full. Remove unused assets before adding more.",
          );
        const src = await uploadImageFile(file),
          asset: ProjectAsset = {
            id: nid(),
            name: file.name.slice(0, 200),
            src,
            category:
              category === "all"
                ? "photo"
                : (category as ProjectAsset["category"]),
          };
        library.add(asset);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="space-y-4">
      <div
        className="space-y-3 rounded-xl bg-muted/60 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background shadow-sm">
            <ImagePlus className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Customer assets</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Keep logos, covers, and captures here.
            </p>
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          aria-label="Upload library images"
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload />
          {busy ? "Uploading…" : "Upload images"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Or drop PNG or JPG files here. Up to 8 MB each.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          aria-label="Search assets"
          placeholder="Search your assets"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        Show
        <select
          aria-label="Asset category"
          className="h-11 rounded-md border bg-background px-3 text-foreground focus-visible:outline-neutral-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["all", "logo", "photo", "screenshot", "cover"].map((c) => (
            <option key={c} value={c}>
              {c === "all"
                ? "All assets"
                : c[0].toUpperCase() + c.slice(1) + "s"}
            </option>
          ))}
        </select>
      </label>
      {assets.length === 0 ? (
        <div className="grid min-h-44 content-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm font-medium">
            {search ? "No matching images" : "Your images belong here"}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {search
              ? "Try another name or category."
              : "Upload a customer logo, photo, or app capture. Use it on any screen."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="overflow-hidden rounded-lg bg-background [box-shadow:var(--elevation-raised)]"
            >
              <button
                type="button"
                aria-label={`Use ${asset.name}`}
                title={
                  onPick ? "Use this image" : "Add this image to the screen"
                }
                className="relative block aspect-[4/3] w-full overflow-hidden bg-muted/50 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-600"
                onClick={() => onPick?.(asset)}
              >
                <img
                  src={img(resolveScreenshot(asset.src, locale))}
                  alt=""
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </button>
              <div className="p-2">
                <button
                  className="min-h-10 w-full truncate rounded px-1 text-left text-xs font-medium hover:bg-muted focus-visible:outline focus-visible:outline-neutral-500"
                  title="Rename asset"
                  aria-label={`Rename ${asset.name}`}
                  onClick={() => {
                    setRenaming(asset);
                    setName(asset.name);
                    setAssetCategory(asset.category);
                  }}
                >
                  {asset.name}
                </button>
                <div className="flex items-center justify-between">
                  <span className="pl-1 text-[11px] capitalize text-muted-foreground">
                    {asset.category}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${asset.name}`}
                    title={
                      library.isUsed(asset.src)
                        ? "Used in this project"
                        : "Remove unused asset from library"
                    }
                    disabled={library.isUsed(asset.src)}
                    onClick={() => library.remove(asset.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={!!renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit asset</DialogTitle>
            <DialogDescription>
              Use a name your team can find again.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            aria-label="Asset name"
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="space-y-2 text-xs text-muted-foreground">
            <span>Asset type</span>
            <select
              aria-label="Asset type"
              className="h-11 w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-neutral-500"
              value={assetCategory}
              onChange={(e) =>
                setAssetCategory(e.target.value as ProjectAsset["category"])
              }
            >
              <option value="logo">Logo</option>
              <option value="photo">Photo</option>
              <option value="screenshot">Screenshot</option>
              <option value="cover">Cover</option>
            </select>
          </label>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              if (renaming)
                library.add({
                  ...renaming,
                  id: renaming.id.length > 200 ? nid() : renaming.id,
                  name: name.trim(),
                  category: assetCategory,
                });
              setRenaming(null);
            }}
          >
            Save name
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
