"use client";
import * as React from "react";
import {
  Image,
  Scan,
  Smartphone,
  RectangleHorizontal,
  ArrowUpRight,
  Shapes,
  Type,
  PanelsTopLeft,
  Stamp,
  Plus,
  Copy,
  Trash2,
  LockKeyhole,
  LockKeyholeOpen,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Group,
  Ungroup,
  Bookmark,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  GalleryHorizontal,
  GalleryVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ELEMENT_INFO,
  ELEMENT_KINDS,
  ICON_NAMES,
  arrangeElements,
  cloneElements,
  copyToSlides,
  createElement,
  customId,
  customKey,
  moveElement,
  placeGroup,
  saveGroup,
  selectedWithGroups,
} from "@/lib/canvas-elements";
import { nid } from "@/lib/defaults";
import { pickText, writeLocalized } from "@/lib/locale";
import { appleFrame } from "@/lib/apple-frames";
import { projectTheme } from "@/lib/brand";
import type {
  CanvasElement,
  ElementId,
  ElementKind,
  ImageAsset,
  ProjectAsset,
  ProjectState,
  SavedGroup,
  Slide,
} from "@/lib/types";
import { getCanvas } from "./slide-canvas";
import { AssetLibrary } from "./asset-library";
import { ELEMENT_ICONS, ElementArtwork } from "./canvas-elements";
import { ScreenshotPicker } from "./screenshot-picker";

const KIND_ICONS = {
  image: Image,
  logo: Stamp,
  device: Smartphone,
  detail: Scan,
  cards: PanelsTopLeft,
  shape: RectangleHorizontal,
  line: ArrowUpRight,
  icon: Shapes,
  text: Type,
};
const fieldClass =
  "h-11 w-full rounded-md border bg-background px-3 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-500";
type Props = {
  state: ProjectState;
  slide: Slide;
  selectedId: ElementId | null;
  onSelect: (id: ElementId | null) => void;
  setState: (f: (p: ProjectState) => ProjectState) => void;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
};

export function ElementsPanel({
  state,
  slide,
  selectedId,
  onSelect,
  setState,
  addOpen,
  setAddOpen,
}: Props) {
  const { cW, cH } = getCanvas(state.device, state.orientation),
    elements = slide.elements || [],
    active = elements.find((e) => e.id === customKey(selectedId));
  const [checked, setChecked] = React.useState<string[]>([]),
    [saveOpen, setSaveOpen] = React.useState(false),
    [groupName, setGroupName] = React.useState(""),
    [copyOpen, setCopyOpen] = React.useState(false),
    [targets, setTargets] = React.useState<string[]>([]);
  React.useEffect(() => {
    setChecked([]);
  }, [slide.id]);
  const selected = selectedWithGroups(
      elements,
      checked.length ? checked : active ? [active.id] : [],
    ),
    ids = selected.map((e) => e.id),
    locked = selected.some((e) => e.locked);
  const otherSlides = state.slidesByDevice[state.device].filter(
    (s) => s.id !== slide.id,
  );
  function change(next: CanvasElement[]) {
    setState((p) => ({
      ...p,
      slidesByDevice: {
        ...p.slidesByDevice,
        [p.device]: p.slidesByDevice[p.device].map((s) =>
          s.id === slide.id ? { ...s, elements: next } : s,
        ),
      },
    }));
  }
  function patch(element: CanvasElement) {
    const moved = moveElement(elements, element.id, element.transform);
    change(moved.map((e) => (e.id === element.id ? element : e)));
  }
  function updateSelected(patch: Partial<CanvasElement>) {
    change(
      elements.map((e) =>
        ids.includes(e.id) ? ({ ...e, ...patch } as CanvasElement) : e,
      ),
    );
  }
  function add(kind: ElementKind) {
    if (elements.length >= 50) return;
    const e = createElement(kind, cW, cH, state.brand?.foreground);
    e.transform.zIndex = Math.min(
      1000,
      Math.max(9, ...elements.map((e) => e.transform.zIndex ?? 10)) + 1,
    );
    if (e.kind === "detail" && slide.screenshot)
      e.asset = { src: slide.screenshot, crop: { x: 50, y: 50, zoom: 2 } };
    if (e.kind === "device") {
      e.device = state.device === "feature-graphic" ? "iphone" : state.device;
      e.orientation =
        e.device === "iphone" || e.device === "android"
          ? "portrait"
          : state.orientation;
      e.src = slide.screenshot;
      const frame = appleFrame(e.device, e.orientation);
      if (frame)
        e.transform.height = (e.transform.width * frame.height) / frame.width;
    }
    change([...elements, e]);
    onSelect(customId(e.id));
    setChecked([]);
    setAddOpen(false);
  }
  function reorder(dir: number) {
    if (!active || locked) return;
    const sorted = [...elements].sort(
      (a, b) => (a.transform.zIndex ?? 10) - (b.transform.zIndex ?? 10),
    );
    const index = sorted.findIndex((e) => e.id === active.id),
      target = Math.max(0, Math.min(sorted.length - 1, index + dir));
    sorted.splice(index, 1);
    sorted.splice(target, 0, active);
    change(
      sorted.map((e, i) => ({
        ...e,
        transform: { ...e.transform, zIndex: i + 5 },
      })),
    );
  }
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Elements</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Build around the real app.
          </p>
        </div>
        <Button
          size="sm"
          disabled={elements.length >= 50}
          onClick={() => setAddOpen(true)}
        >
          <Plus />
          Add
        </Button>
      </div>
      {!elements.length ? (
        <div className="grid min-h-44 content-center gap-3 rounded-xl border border-dashed px-5 py-6 text-center">
          <div className="mx-auto flex gap-2 text-muted-foreground">
            <Image className="size-5" />
            <RectangleHorizontal className="size-5" />
            <Type className="size-5" />
          </div>
          <p className="text-sm font-medium">Make this screen your own</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Add a logo, a photo, or a closer look at the app. Keep the main
            message clear.
          </p>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            Add your first element
          </Button>
        </div>
      ) : (
        <section
          aria-label="Element layers"
          className="overflow-hidden rounded-xl [box-shadow:var(--elevation-raised)]"
        >
          {[...elements]
            .sort(
              (a, b) => (b.transform.zIndex ?? 10) - (a.transform.zIndex ?? 10),
            )
            .map((e) => {
              const Icon = KIND_ICONS[e.kind],
                selectedRow = active?.id === e.id;
              return (
                <div
                  key={e.id}
                  className={`flex items-center border-b last:border-b-0 ${selectedRow ? "bg-accent" : "bg-background"}`}
                >
                  <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center">
                    <input
                      type="checkbox"
                      className="size-4 accent-neutral-700 focus-visible:outline-neutral-500"
                      aria-label={`Select ${e.name} for group`}
                      checked={checked.includes(e.id)}
                      onChange={(event) =>
                        setChecked((prev) =>
                          event.target.checked
                            ? [...prev, e.id]
                            : prev.filter((id) => id !== e.id),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded px-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-500"
                    aria-label={`Edit ${e.name}`}
                    aria-pressed={selectedRow}
                    onClick={() => {
                      onSelect(customId(e.id));
                      setChecked([]);
                    }}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {e.name}
                    </span>
                    {e.groupId && (
                      <Group className="size-3 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${e.hidden ? "Show" : "Hide"} ${e.name}`}
                    onClick={() => patch({ ...e, hidden: !e.hidden })}
                  >
                    {e.hidden ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${e.locked ? "Unlock" : "Lock"} ${e.name}`}
                    onClick={() => patch({ ...e, locked: !e.locked })}
                  >
                    {e.locked ? <LockKeyhole /> : <LockKeyholeOpen />}
                  </Button>
                </div>
              );
            })}
        </section>
      )}
      {selected.length > 0 && (
        <section className="space-y-3" aria-label="Arrange elements">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tabular-nums">
              {selected.length > 1
                ? `${selected.length} elements selected`
                : "Arrange"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {locked
                ? "Unlock to edit"
                : selected.length > 1
                  ? "Within selection"
                  : "On this screen"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ["left", AlignLeft, "Align left"],
                ["center", AlignCenter, "Center horizontally"],
                ["right", AlignRight, "Align right"],
                ["space-x", GalleryHorizontal, "Space evenly across"],
                ["top", AlignStartVertical, "Align top"],
                ["middle", AlignCenterVertical, "Center vertically"],
                ["bottom", AlignEndVertical, "Align bottom"],
                ["space-y", GalleryVertical, "Space evenly down"],
              ] as const
            ).map(([action, Icon, label]) => (
              <Button
                key={action}
                variant="outline"
                size="icon"
                className="w-full"
                title={label}
                aria-label={label}
                disabled={
                  locked || (action.startsWith("space-") && selected.length < 3)
                }
                onClick={() =>
                  change(arrangeElements(elements, ids, action, cW, cH))
                }
              >
                <Icon />
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={locked || elements.length + selected.length > 50}
              onClick={() => {
                const copies = cloneElements(selected);
                const max = Math.max(
                  9,
                  ...elements.map((e) => e.transform.zIndex ?? 10),
                );
                change([
                  ...elements,
                  ...copies.map((e, i) => ({
                    ...e,
                    transform: {
                      ...e.transform,
                      zIndex: Math.min(1000, max + 1 + i),
                    },
                  })),
                ]);
                onSelect(customId(copies[0].id));
                setChecked([]);
              }}
            >
              <Copy />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!otherSlides.length}
              onClick={() => {
                setTargets([]);
                setCopyOpen(true);
              }}
            >
              <ArrowRight />
              Copy to screens
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={locked || selected.length < 2}
              onClick={() => {
                const grouped = selected.every(
                  (e) => e.groupId && e.groupId === selected[0].groupId,
                );
                updateSelected({ groupId: grouped ? undefined : nid() });
              }}
            >
              {selected.every(
                (e) => e.groupId && e.groupId === selected[0].groupId,
              ) ? (
                <>
                  <Ungroup />
                  Ungroup
                </>
              ) : (
                <>
                  <Group />
                  Group
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(state.savedGroups?.length || 0) >= 30}
              onClick={() => {
                setGroupName("");
                setSaveOpen(true);
              }}
            >
              <Bookmark />
              Save group
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move element forward"
              title="Move forward"
              disabled={!active || locked}
              onClick={() => reorder(1)}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move element backward"
              title="Move backward"
              disabled={!active || locked}
              onClick={() => reorder(-1)}
            >
              <ChevronDown />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              disabled={locked}
              onClick={() => {
                change(elements.filter((e) => !ids.includes(e.id)));
                setChecked([]);
                onSelect(null);
              }}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
          {selected.length > 1 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Grouped elements move together. Select one layer to edit its
              content.
            </p>
          )}
        </section>
      )}
      {active && checked.length < 2 && (
        <ElementSettings
          element={active}
          locale={state.locale}
          disabled={locked}
          onChange={patch}
        />
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add an element</DialogTitle>
            <DialogDescription>
              Use the customer's assets to tell one clear story.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ELEMENT_KINDS.map((kind) => {
              const Icon = KIND_ICONS[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={elements.length >= 50}
                  onClick={() => add(kind)}
                  className="group min-h-32 rounded-xl bg-background p-4 text-left [box-shadow:var(--elevation-raised)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-muted/70 hover:[box-shadow:var(--elevation-raised-hover)] active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-600"
                >
                  <Icon className="mb-4 size-6 text-foreground" />
                  <span className="block text-sm font-medium">
                    {ELEMENT_INFO[kind].name}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {ELEMENT_INFO[kind].description}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save a reusable group</DialogTitle>
            <DialogDescription>
              Keep these elements in this customer's asset library.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Group name"
            placeholder="For example, Teacher introduction"
            maxLength={100}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button
            disabled={!groupName.trim() || !selected.length}
            onClick={() => {
              const group = saveGroup(groupName.trim(), selected);
              setState((p) => ({
                ...p,
                savedGroups: [...(p.savedGroups || []), group],
              }));
              setSaveOpen(false);
              toast.success("Group saved in Assets");
            }}
          >
            Save group
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy to screens</DialogTitle>
            <DialogDescription>
              Keep the same placement on selected screens in this device deck.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {otherSlides.map((s, i) => (
              <label
                key={s.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 hover:bg-muted"
              >
                <input
                  className="size-4 accent-neutral-700"
                  type="checkbox"
                  disabled={(s.elements?.length || 0) + selected.length > 50}
                  checked={targets.includes(s.id)}
                  onChange={(e) =>
                    setTargets((prev) =>
                      e.target.checked
                        ? [...prev, s.id]
                        : prev.filter((id) => id !== s.id),
                    )
                  }
                />
                <span className="text-sm">
                  {pickText(s.headline, state.locale) || `Screen ${i + 1}`}
                </span>
              </label>
            ))}
          </div>
          <Button
            disabled={!targets.length}
            onClick={() => {
              setState((p) => ({
                ...p,
                slidesByDevice: {
                  ...p.slidesByDevice,
                  [p.device]: copyToSlides(
                    p.slidesByDevice[p.device],
                    slide.id,
                    targets,
                    selected,
                  ),
                },
              }));
              setCopyOpen(false);
              toast.success("Elements copied");
            }}
          >
            Copy elements
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AssetsPanel({
  state,
  slide,
  setState,
  onSelect,
}: {
  state: ProjectState;
  slide: Slide | null;
  setState: Props["setState"];
  onSelect: Props["onSelect"];
}) {
  const { cW, cH } = getCanvas(state.device, state.orientation);
  function add(elements: CanvasElement[]) {
    if (!slide) return;
    const max = Math.max(
      9,
      ...(slide.elements || []).map((e) => e.transform.zIndex ?? 10),
    );
    elements = elements.map((e, i) => ({
      ...e,
      transform: { ...e.transform, zIndex: Math.min(1000, max + i + 1) },
    }));
    setState((p) => ({
      ...p,
      slidesByDevice: {
        ...p.slidesByDevice,
        [p.device]: p.slidesByDevice[p.device].map((s) =>
          s.id === slide.id
            ? { ...s, elements: [...(s.elements || []), ...elements] }
            : s,
        ),
      },
    }));
    onSelect(customId(elements[0].id));
  }
  return (
    <div className="space-y-6 p-4">
      <AssetLibrary
        locale={state.locale}
        onPick={(asset) => {
          if (!slide || (slide.elements?.length || 0) >= 50) {
            toast.error("Select a screen with room for another element.");
            return;
          }
          const e = createElement(
            asset.category === "logo" ? "logo" : "image",
            cW,
            cH,
          );
          if (e.kind === "image" || e.kind === "logo") {
            e.asset = { src: asset.src };
            e.name = asset.name.slice(0, 100);
          }
          add([e]);
        }}
      />
      <section className="space-y-3 border-t pt-5">
        <div className="flex items-center gap-2">
          <Bookmark className="size-4" />
          <h3 className="text-sm font-semibold">Saved groups</h3>
        </div>
        {!state.savedGroups?.length ? (
          <p className="rounded-lg bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
            Select elements, then choose Save group. Reuse the layout here with
            new images and text.
          </p>
        ) : (
          state.savedGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 rounded-lg p-2 [box-shadow:var(--elevation-raised)]"
            >
              <GroupPreview group={group} state={state} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{group.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  {group.elements.length} elements
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    !slide ||
                    (slide.elements?.length || 0) + group.elements.length > 50
                  }
                  onClick={() => add(placeGroup(group, cW, cH))}
                >
                  Use group
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove saved group ${group.name}`}
                onClick={() =>
                  setState((p) => ({
                    ...p,
                    savedGroups: p.savedGroups?.filter(
                      (g) => g.id !== group.id,
                    ),
                  }))
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
function GroupPreview({
  group,
  state,
}: {
  group: SavedGroup;
  state: ProjectState;
}) {
  const scale = Math.min(72 / group.width, 72 / group.height);
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-muted">
      <div
        style={{
          position: "absolute",
          width: group.width,
          height: group.height,
          left: (80 - group.width * scale) / 2,
          top: (80 - group.height * scale) / 2,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        {group.elements
          .filter((e) => !e.hidden)
          .map((e) => (
            <div
              key={e.id}
              style={{
                position: "absolute",
                left: e.transform.x,
                top: e.transform.y,
                width: e.transform.width,
                height: e.transform.height,
                transform: `rotate(${e.transform.rotation || 0}deg)`,
                opacity: e.opacity / 100,
                zIndex: e.transform.zIndex,
              }}
            >
              <ElementArtwork
                element={e}
                theme={projectTheme(state)}
                locale={state.locale}
                slideId=""
                hideEmpty
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        aria-label={label}
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        className={fieldClass}
        onChange={(e) => {
          if (e.target.value !== "" && Number.isFinite(e.target.valueAsNumber))
            onChange(Math.max(min, Math.min(max, e.target.valueAsNumber)));
        }}
      />
    </Field>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex h-11 items-center gap-2 rounded-md border bg-background px-2">
        <input
          type="color"
          aria-label={label}
          className="h-9 w-10 cursor-pointer border-0 bg-transparent"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-xs uppercase tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </Field>
  );
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        aria-label={label}
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v[0].toUpperCase() + v.slice(1)}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100) / 100}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        className="h-11 w-full accent-neutral-700 focus-visible:outline focus-visible:outline-neutral-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function AssetField({
  label,
  asset,
  locale,
  onChange,
  allowCrop = true,
}: {
  label: string;
  asset: ImageAsset;
  locale: string;
  onChange: (a: ImageAsset) => void;
  allowCrop?: boolean;
}) {
  const [open, setOpen] = React.useState(false),
    crop = asset.crop || { x: 50, y: 50, zoom: 1 };
  return (
    <div className="space-y-2">
      <ScreenshotPicker
        label={label}
        value={asset.src}
        locale={locale}
        onChange={(src) => onChange({ src, crop: { x: 50, y: 50, zoom: 1 } })}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Choose from assets
      </Button>
      {asset.src && allowCrop && (
        <details className="rounded-lg bg-muted/50 px-3">
          <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium">
            Crop and zoom
          </summary>
          <Slider
            label={`${label} horizontal crop`}
            value={crop.x}
            onChange={(x) => onChange({ ...asset, crop: { ...crop, x } })}
          />
          <Slider
            label={`${label} vertical crop`}
            value={crop.y}
            onChange={(y) => onChange({ ...asset, crop: { ...crop, y } })}
          />
          <Slider
            label={`${label} zoom`}
            value={crop.zoom}
            min={1}
            max={8}
            step={0.05}
            onChange={(zoom) => onChange({ ...asset, crop: { ...crop, zoom } })}
          />
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() =>
              onChange({ ...asset, crop: { x: 50, y: 50, zoom: 1 } })
            }
          >
            Reset crop
          </Button>
        </details>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose an asset</DialogTitle>
            <DialogDescription>
              Use an image already in this customer's project.
            </DialogDescription>
          </DialogHeader>
          <AssetLibrary
            locale={locale}
            onPick={(a) => {
              onChange({ src: a.src, crop: { x: 50, y: 50, zoom: 1 } });
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ElementSettings({
  element: e,
  locale,
  disabled,
  onChange,
}: {
  element: CanvasElement;
  locale: string;
  disabled: boolean;
  onChange: (e: CanvasElement) => void;
}) {
  const patch = (value: Record<string, unknown>) =>
    onChange({ ...e, ...value } as CanvasElement);
  const rect = (value: Partial<CanvasElement["transform"]>) => {
    if (
      (e.kind === "image" || e.kind === "logo" || e.kind === "detail") &&
      e.lockAspect
    ) {
      if (value.width)
        value.height = (value.width * e.transform.height) / e.transform.width;
      if (value.height && !value.width)
        value.width = (value.height * e.transform.width) / e.transform.height;
    }
    if (e.kind === "device") {
      const f = appleFrame(e.device, e.orientation),
        ratio = f
          ? f.width / f.height
          : e.device === "android"
            ? 9 / 19.5
            : e.orientation === "portrait"
              ? 5 / 8
              : 8 / 5;
      if (value.width) value.height = value.width / ratio;
      else if (value.height) value.width = value.height * ratio;
    }
    patch({ transform: { ...e.transform, ...value } });
  };
  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 border-t pt-4 disabled:opacity-60"
    >
      <legend className="sr-only">Element settings</legend>
      <Field label="Element name">
        <Input
          aria-label="Element name"
          maxLength={100}
          value={e.name}
          onChange={(v) => {
            if (v.target.value.trim()) patch({ name: v.target.value });
          }}
        />
      </Field>
      {(e.kind === "image" || e.kind === "logo" || e.kind === "detail") && (
        <>
          <AssetField
            label={e.kind === "detail" ? "Source screenshot" : "Element image"}
            asset={e.asset}
            locale={locale}
            onChange={(asset) => patch({ asset })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Choice
              label="Image fit"
              value={e.fit}
              options={["cover", "contain"]}
              onChange={(fit) => patch({ fit })}
            />
            <NumberField
              label="Image corners"
              value={e.radius}
              max={2000}
              onChange={(radius) => patch({ radius })}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-xs">
            <input
              type="checkbox"
              className="size-4 accent-neutral-700"
              checked={e.lockAspect}
              onChange={(v) => patch({ lockAspect: v.target.checked })}
            />
            Keep proportions when resizing
          </label>
          {e.kind === "detail" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use Crop and zoom to enlarge the part of the real screenshot you
              want to explain.
            </p>
          )}
        </>
      )}
      {e.kind === "device" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Choice
              label="Frame device"
              value={e.device}
              options={["iphone", "ipad", "android", "android-7", "android-10"]}
              onChange={(device) => {
                const orientation =
                  device === "iphone" || device === "android"
                    ? "portrait"
                    : e.orientation;
                const f = appleFrame(device as "iphone" | "ipad", orientation);
                patch({
                  device,
                  orientation,
                  transform: {
                    ...e.transform,
                    height:
                      e.transform.width /
                      (f
                        ? f.width / f.height
                        : device === "android"
                          ? 9 / 19.5
                          : orientation === "portrait"
                            ? 5 / 8
                            : 8 / 5),
                  },
                });
              }}
            />
            <Choice
              label="Frame orientation"
              value={e.orientation}
              options={
                e.device === "iphone" || e.device === "android"
                  ? ["portrait"]
                  : ["portrait", "landscape"]
              }
              onChange={(orientation) => {
                const f = appleFrame(
                  e.device,
                  orientation as "portrait" | "landscape",
                );
                patch({
                  orientation,
                  transform: {
                    ...e.transform,
                    height:
                      e.transform.width /
                      (f
                        ? f.width / f.height
                        : orientation === "portrait"
                          ? 5 / 8
                          : 8 / 5),
                  },
                });
              }}
            />
          </div>
          <AssetField
            label="Device screenshot"
            asset={{ src: e.src }}
            locale={locale}
            allowCrop={false}
            onChange={(asset) => patch({ src: asset.src })}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Use a capture from the matching device. The original frame keeps its
            proportions.
          </p>
        </>
      )}
      {e.kind === "text" && (
        <>
          <Field label={`Text · ${locale.toUpperCase()}`}>
            <Textarea
              aria-label="Element text"
              rows={3}
              value={e.text[locale] || ""}
              placeholder="Write a short, useful message"
              onChange={(v) =>
                patch({ text: writeLocalized(e.text, locale, v.target.value) })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Text size"
              value={e.fontSize}
              min={8}
              max={2000}
              onChange={(fontSize) => patch({ fontSize })}
            />
            <Choice
              label="Text weight"
              value={String(e.fontWeight)}
              options={["400", "500", "600", "700", "800"]}
              onChange={(v) => patch({ fontWeight: Number(v) })}
            />
            <ColorField
              label="Text color"
              value={e.color}
              onChange={(color) => patch({ color })}
            />
            <Choice
              label="Text alignment"
              value={e.align}
              options={["left", "center", "right"]}
              onChange={(align) => patch({ align })}
            />
          </div>
        </>
      )}
      {e.kind === "shape" && (
        <>
          <Choice
            label="Shape"
            value={e.shape}
            options={["rectangle", "ellipse"]}
            onChange={(shape) => patch({ shape })}
          />
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Fill color"
              value={e.fill}
              onChange={(fill) => patch({ fill })}
            />
            <ColorField
              label="Border color"
              value={e.stroke}
              onChange={(stroke) => patch({ stroke })}
            />
            <NumberField
              label="Border width"
              value={e.strokeWidth}
              max={100}
              onChange={(strokeWidth) => patch({ strokeWidth })}
            />
            {e.shape === "rectangle" && (
              <NumberField
                label="Shape corners"
                value={e.radius}
                max={2000}
                onChange={(radius) => patch({ radius })}
              />
            )}
          </div>
        </>
      )}
      {e.kind === "line" && (
        <>
          <ColorField
            label="Line color"
            value={e.color}
            onChange={(color) => patch({ color })}
          />
          <NumberField
            label="Line thickness"
            value={e.thickness}
            min={1}
            max={100}
            onChange={(thickness) => patch({ thickness })}
          />
          <div className="grid grid-cols-2 gap-3">
            {(["arrow", "dashed"] as const).map((key) => (
              <label
                key={key}
                className="flex min-h-11 items-center gap-2 text-xs capitalize"
              >
                <input
                  className="size-4 accent-neutral-700"
                  type="checkbox"
                  checked={e[key]}
                  onChange={(v) => patch({ [key]: v.target.checked })}
                />
                {key}
              </label>
            ))}
          </div>
        </>
      )}
      {e.kind === "icon" && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {ICON_NAMES.map((name) => {
              const Icon = ELEMENT_ICONS[name];
              return (
                <Button
                  key={name}
                  variant={e.icon === name ? "secondary" : "outline"}
                  size="icon"
                  className="w-full"
                  aria-label={`${name} icon`}
                  aria-pressed={e.icon === name}
                  onClick={() => patch({ icon: name })}
                >
                  <Icon />
                </Button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Icon color"
              value={e.color}
              onChange={(color) => patch({ color })}
            />
            <NumberField
              label="Icon stroke"
              value={e.strokeWidth}
              min={0.5}
              max={4}
              step={0.25}
              onChange={(strokeWidth) => patch({ strokeWidth })}
            />
          </div>
        </>
      )}
      {e.kind === "cards" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Choice
              label="Card layout"
              value={e.layout}
              options={["row", "column", "grid"]}
              onChange={(layout) => patch({ layout })}
            />
            <NumberField
              label="Card spacing"
              value={e.gap}
              max={300}
              onChange={(gap) => patch({ gap })}
            />
            <NumberField
              label="Card corners"
              value={e.radius}
              max={2000}
              onChange={(radius) => patch({ radius })}
            />
            <NumberField
              label="Card text size"
              value={e.fontSize}
              min={8}
              max={1000}
              onChange={(fontSize) => patch({ fontSize })}
            />
          </div>
          <ColorField
            label="Card text color"
            value={e.color}
            onChange={(color) => patch({ color })}
          />
          {e.items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-xl border p-3">
              <AssetField
                label={`Card ${index + 1} image`}
                asset={item.asset}
                locale={locale}
                onChange={(asset) =>
                  patch({
                    items: e.items.map((v, i) =>
                      i === index ? { ...v, asset } : v,
                    ),
                  })
                }
              />
              <Input
                aria-label={`Card ${index + 1} title`}
                placeholder="Optional title"
                value={item.title[locale] || ""}
                onChange={(v) =>
                  patch({
                    items: e.items.map((it, i) =>
                      i === index
                        ? {
                            ...it,
                            title: writeLocalized(
                              it.title,
                              locale,
                              v.target.value,
                            ),
                          }
                        : it,
                    ),
                  })
                }
              />
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move card ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => {
                    const items = [...e.items];
                    [items[index - 1], items[index]] = [
                      items[index],
                      items[index - 1],
                    ];
                    patch({ items });
                  }}
                >
                  <ChevronUp />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move card ${index + 1} down`}
                  disabled={index === e.items.length - 1}
                  onClick={() => {
                    const items = [...e.items];
                    [items[index + 1], items[index]] = [
                      items[index],
                      items[index + 1],
                    ];
                    patch({ items });
                  }}
                >
                  <ChevronDown />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  disabled={e.items.length <= 2}
                  onClick={() =>
                    patch({ items: e.items.filter((_, i) => i !== index) })
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            disabled={e.items.length >= 6}
            onClick={() =>
              patch({ items: [...e.items, { asset: { src: "" }, title: {} }] })
            }
          >
            <Plus />
            Add card
          </Button>
        </>
      )}
      <details className="border-t pt-2" open>
        <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium">
          Position and size
        </summary>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="X position"
            value={e.transform.x}
            min={-100000}
            onChange={(x) => rect({ x })}
          />
          <NumberField
            label="Y position"
            value={e.transform.y}
            min={-100000}
            onChange={(y) => rect({ y })}
          />
          <NumberField
            label="Width"
            value={e.transform.width}
            min={1}
            onChange={(width) => rect({ width })}
          />
          <NumberField
            label="Height"
            value={e.transform.height}
            min={1}
            onChange={(height) => rect({ height })}
          />
          <NumberField
            label="Rotation"
            value={e.transform.rotation || 0}
            min={-180}
            max={180}
            onChange={(rotation) => rect({ rotation })}
          />
          <NumberField
            label="Layer order"
            value={e.transform.zIndex || 0}
            min={-1000}
            max={1000}
            onChange={(zIndex) => rect({ zIndex })}
          />
        </div>
      </details>
      <Slider
        label="Opacity"
        value={e.opacity}
        onChange={(opacity) => patch({ opacity })}
      />
    </fieldset>
  );
}
