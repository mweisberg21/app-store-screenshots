"use client";
import * as React from "react";
import { Rnd } from "react-rnd";
import { RotateCw } from "lucide-react";
import type { ElementTransform } from "@/lib/types";
import { snapPosition } from "@/lib/element-snapping";

// Fraction of an element's width/height that must remain inside the canvas
// when overflow is allowed. Keeps a graspable handle visible so the user can
// always drag the element back onto the canvas.
const MIN_VISIBLE_FRAC = 0.1;

function clampRect(
  r: { x: number; y: number; width: number; height: number },
  boundsW: number,
  boundsH: number,
  allowOverflow = false,
) {
  if (allowOverflow) {
    const width = r.width;
    const height = r.height;
    const minVisX = Math.max(8, width * MIN_VISIBLE_FRAC);
    const minVisY = Math.max(8, height * MIN_VISIBLE_FRAC);
    const x = Math.max(-(width - minVisX), Math.min(r.x, boundsW - minVisX));
    const y = Math.max(-(height - minVisY), Math.min(r.y, boundsH - minVisY));
    return { x, y, width, height };
  }
  const width = Math.min(r.width, boundsW);
  const height = Math.min(r.height, boundsH);
  const x = Math.max(0, Math.min(r.x, boundsW - width));
  const y = Math.max(0, Math.min(r.y, boundsH - height));
  return { x, y, width, height };
}

export function Movable({
  rect,
  boundsW,
  boundsH,
  editable,
  previewScale,
  onChange,
  children,
  lockAspectRatio,
  zIndex,
  rotation = 0,
  allowOverflow = false,
  selected = false,
  onSelect,
  locked = false,
  snap,
}: {
  rect: ElementTransform;
  boundsW: number;
  boundsH: number;
  editable?: boolean;
  previewScale: number;
  onChange: (t: ElementTransform) => void;
  children: React.ReactNode;
  lockAspectRatio?: number | boolean;
  zIndex?: number;
  rotation?: number;
  allowOverflow?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  locked?: boolean;
  snap?: { x: number[]; y: number[] };
}) {
  const [dragPosition, setDragPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [guides, setGuides] = React.useState<{ x?: number; y?: number }>({});
  const rotationRef = React.useRef(rotation);
  React.useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  function startRotate(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();

    const root = e.currentTarget.closest(".rnd-editable") as HTMLElement | null;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    const startAngle = pointerAngle(e.clientX, e.clientY, centerX, centerY);
    const startRotation = rotationRef.current;

    const handleMove = (event: PointerEvent) => {
      event.preventDefault();
      const nextRotation = normalizeRotation(
        startRotation +
          pointerAngle(event.clientX, event.clientY, centerX, centerY) -
          startAngle,
      );
      rotationRef.current = nextRotation;
      onChange({
        x: display.x,
        y: display.y,
        width: display.width,
        height: display.height,
        rotation: nextRotation,
        zIndex,
      });
    };
    const stopRotate = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopRotate);
      window.removeEventListener("pointercancel", stopRotate);
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", stopRotate, { once: true });
    window.addEventListener("pointercancel", stopRotate, { once: true });
  }

  // Rotation lives on the inner wrapper so the Rnd's axis-aligned rect remains
  // the authoritative bounding box for drag/resize math. A bare mousedown
  // listener (no stopPropagation — that would prevent react-rnd from starting
  // a drag) marks the element as the current selection.
  const rotated = (
    <div
      onMouseDown={(event) => {
        if (editable) {
          const root =
            event.currentTarget.closest<HTMLElement>(".rnd-editable");
          root?.focus({ preventScroll: true });
          onSelect?.();
        }
      }}
      style={{
        width: "100%",
        height: "100%",
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );

  // Non-editable (export/thumb) path: plain absolute-positioned div, no Rnd.
  if (!editable) {
    return (
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex,
        }}
      >
        {rotated}
      </div>
    );
  }

  const display = clampRect(rect, boundsW, boundsH, allowOverflow);
  const controlScale = Math.max(0.05, previewScale);

  return (
    <Rnd
      tabIndex={0}
      bounds={allowOverflow ? undefined : "parent"}
      scale={previewScale}
      lockAspectRatio={lockAspectRatio}
      disableDragging={locked}
      enableResizing={!locked && selected}
      position={{ x: display.x, y: display.y }}
      size={{ width: display.width, height: display.height }}
      onDragStart={() => onSelect?.()}
      onResizeStart={() => onSelect?.()}
      onDrag={(_e, d) => {
        setDragPosition({ x: d.x, y: d.y });
        if (snap) {
          setGuides(
            snapPosition({ ...rect, x: d.x, y: d.y }, snap, 8 / controlScale)
              .guides,
          );
          onChange({
            ...clampRect(
              { ...rect, x: d.x, y: d.y },
              boundsW,
              boundsH,
              allowOverflow,
            ),
            rotation,
            zIndex,
          });
        }
      }}
      onDragStop={(_e, d) => {
        const position = snap
          ? snapPosition(
              { ...rect, x: d.x, y: d.y },
              snap,
              8 / Math.max(0.05, previewScale),
            )
          : d;
        setGuides({});
        setDragPosition(null);
        const next = clampRect(
          {
            x: position.x,
            y: position.y,
            width: display.width,
            height: display.height,
          },
          boundsW,
          boundsH,
          allowOverflow,
        );
        onChange({ ...next, rotation, zIndex });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const next = clampRect(
          {
            x: position.x,
            y: position.y,
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
          },
          boundsW,
          boundsH,
          allowOverflow,
        );
        onChange({ ...next, rotation, zIndex });
      }}
      style={{ zIndex }}
      resizeHandleStyles={handleStyle}
      className={selected ? "rnd-editable rnd-selected" : "rnd-editable"}
    >
      {rotated}
      {guides.x !== undefined && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            pointerEvents: "none",
            left: guides.x - (dragPosition?.x ?? display.x),
            top: -(dragPosition?.y ?? display.y),
            width: 1 / controlScale,
            height: boundsH,
            background: "#737373",
          }}
        />
      )}
      {guides.y !== undefined && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            pointerEvents: "none",
            left: -(dragPosition?.x ?? display.x),
            top: guides.y - (dragPosition?.y ?? display.y),
            height: 1 / controlScale,
            width: boundsW,
            background: "#737373",
          }}
        />
      )}
      {!locked && selected && (
        <button
          type="button"
          className="rnd-rotate-handle"
          style={{
            right: -20 / controlScale,
            top: -44 / controlScale,
            width: 40 / controlScale,
            height: 40 / controlScale,
          }}
          onPointerDown={startRotate}
          title="Rotate"
          aria-label="Rotate element"
        >
          <RotateCw
            style={{ width: 14 / controlScale, height: 14 / controlScale }}
          />
        </button>
      )}
    </Rnd>
  );
}

function pointerAngle(x: number, y: number, centerX: number, centerY: number) {
  return (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
}

function normalizeRotation(degrees: number) {
  let next = degrees;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return Math.round(next);
}

// Subtle resize handles (visible only on hover via globals.css).
const handleSize = 14;
const handleStyle: Record<string, React.CSSProperties> = {
  top: { height: handleSize },
  right: { width: handleSize },
  bottom: { height: handleSize },
  left: { width: handleSize },
  topRight: { width: handleSize, height: handleSize },
  bottomRight: { width: handleSize, height: handleSize },
  bottomLeft: { width: handleSize, height: handleSize },
  topLeft: { width: handleSize, height: handleSize },
};
