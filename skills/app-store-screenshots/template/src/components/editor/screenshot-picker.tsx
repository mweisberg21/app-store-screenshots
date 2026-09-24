"use client";
import * as React from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { didFail, img, setImage } from "@/lib/image-cache";
import { AssetContext } from "./asset-context";
import { nid } from "@/lib/defaults";
import { resolveScreenshot } from "@/lib/locale";

type Props = {
  label: string;
  value: string;
  locale?: string;
  onChange: (v: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

const ACCEPTED = ["image/png", "image/jpeg"];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const resp = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const json = (await resp.json()) as { ok: boolean; path?: string; error?: string };
  if (!resp.ok || !json.ok || !json.path) throw new Error(json.error || "Image upload failed");
  return json.path;
}

export function ScreenshotPicker({ label, value, locale, onChange, onBusyChange }: Props) {
  const library=React.useContext(AssetContext);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onBusyChange?.(false); };
  }, [onBusyChange]);

  React.useEffect(() => {
    setError(null);
  }, [value, locale]);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Use PNG or JPG (App Store rejects other formats)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large (>8MB)");
      return;
    }
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file);
    } catch {
      setError("Failed to read file");
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    try {
      const uploadedPath = await uploadDataUrl(dataUrl);
      setImage(uploadedPath, dataUrl);
      if (mounted.current) { library.add({id:nid(),name:file.name,src:uploadedPath,category:label.toLowerCase().includes("icon")?"logo":"photo"}); onChange(uploadedPath); }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      if (mounted.current) { setUploading(false); onBusyChange?.(false); }
    }
  }

  const hasValue = !!value;
  const isData = hasValue && value.startsWith("data:");
  const resolvedValue = hasValue && !isData && locale ? resolveScreenshot(value, locale) : value;
  const previewSrc = isData ? value : hasValue ? img(resolvedValue) : "";
  // Only flag "image not found" when the path is a real URL that we tried and failed.
  const knownMissing = hasValue && !isData && didFail(resolvedValue);
  const valueLabel = uploading
    ? "saving…"
    : !hasValue
      ? "drop image, or click Pick"
      : isData
        ? "uploaded image (not on disk)"
        : value.startsWith("/screenshots/uploaded/") ? "Uploaded image"
        : value.replace(/^.*\/(?=[^/]+\/[^/]+$)/, "…/");

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
          dragging ? "border-primary bg-accent ring-2 ring-primary/30" : "border-input"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await handleFile(file);
        }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
              onError={() => setError("Image failed to load")}
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium">{label}</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {dragging ? "Drop to upload" : valueLabel}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          aria-label={`Upload ${label.toLowerCase()}`}
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (file) await handleFile(file);
            input.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 min-w-11"
          disabled={uploading}
          aria-label={`Pick ${label.toLowerCase()}`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Pick
        </Button>
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-10 md:w-10"
            disabled={uploading}
            onClick={() => {
              onChange("");
              setError(null);
            }}
            aria-label={`Clear ${label.toLowerCase()}`}
            title="Clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : knownMissing ? (
        <p className="text-[11px] text-destructive">Image not found at {resolvedValue}</p>
      ) : null}
    </div>
  );
}

export async function uploadImageFile(file: File) {
  if (!ACCEPTED.includes(file.type)) throw new Error("Choose a PNG or JPG image.");
  if (file.size>8*1024*1024) throw new Error("Choose an image smaller than 8 MB.");
  const data=await fileToDataUrl(file);
  const path=await uploadDataUrl(data);
  setImage(path,data);
  return path;
}
