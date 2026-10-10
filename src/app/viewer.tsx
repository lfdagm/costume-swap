"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { entranceLabel, type entrances } from "@/config";
import type { Costume } from "@/lib/costumes";

const ZOOM = 2.5;

type Zoom = { id: string; width: number; fx: number; fy: number };

// Full-screen photo viewer. Tap the photo to zoom in on that spot, drag/swipe to
// move around, tap again to zoom out. Arrows, arrow keys or swiping go to the
// previous/next costume.
export function CostumeViewer({
  costume,
  entrance,
  taken,
  position,
  neighbors,
  onPrev,
  onNext,
  onClose,
}: {
  costume: Costume;
  entrance: (typeof entrances)[number];
  taken: boolean;
  position: string;
  neighbors: string[]; // photo URLs to preload
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [zoomState, setZoom] = useState<Zoom | null>(null);
  // Zoom belongs to one photo; moving to another costume shows it whole.
  const zoom = zoomState?.id === costume.id ? zoomState : null;
  const name = costume.name || "Costume";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Preload the previous/next photos so flipping through is instant.
  useEffect(() => {
    for (const src of neighbors) new window.Image().src = src;
  }, [neighbors]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") onPrev();
    else if (e.key === "ArrowRight") onNext();
  }

  // Swipe left/right on the photo (when not zoomed) to change costume.
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipe.current =
      !zoom && e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) onPrev();
    else onNext();
  }

  // After zooming in, scroll so the tapped spot is in the middle of the screen.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const img = imgRef.current;
    if (!zoom || !scroller || !img) return;
    scroller.scrollLeft =
      img.offsetLeft + zoom.fx * img.offsetWidth - scroller.clientWidth / 2;
    scroller.scrollTop =
      img.offsetTop + zoom.fy * img.offsetHeight - scroller.clientHeight / 2;
  }, [zoom]);

  function zoomIn(clientX?: number, clientY?: number) {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    // The photo is letterboxed (object-contain), so find where it actually sits.
    const box = img.getBoundingClientRect();
    const scale = Math.min(
      box.width / img.naturalWidth,
      box.height / img.naturalHeight,
    );
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    const left = box.left + (box.width - width) / 2;
    const top = box.top + (box.height - height) / 2;
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    setZoom({
      id: costume.id,
      width: width * ZOOM,
      fx: clientX === undefined ? 0.5 : clamp((clientX - left) / width),
      fy: clientY === undefined ? 0.5 : clamp((clientY - top) / height),
    });
  }

  function onPhotoClick(e: React.MouseEvent) {
    if (drag.current?.moved) return;
    if (zoom) setZoom(null);
    else zoomIn(e.clientX, e.clientY);
  }

  // Mouse drag to pan when zoomed (touch screens already pan by swiping).
  function onPointerDown(e: React.PointerEvent) {
    const scroller = scrollerRef.current;
    if (!zoom || e.pointerType !== "mouse" || !scroller) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      left: scroller.scrollLeft,
      top: scroller.scrollTop,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const scroller = scrollerRef.current;
    if (!d || !scroller || e.buttons !== 1) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    scroller.scrollLeft = d.left - dx;
    scroller.scrollTop = d.top - dy;
  }

  function onPointerUp() {
    // Let the click handler see `moved` first, then reset.
    setTimeout(() => (drag.current = null));
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={onKeyDown}
      aria-label={name}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold">{name}</h3>
            <p className="text-xs text-white/60">
              {position} ·{" "}
              {zoom
                ? "Drag to move · tap to zoom out"
                : "Tap the photo to zoom"}
            </p>
          </div>
          <button
            onClick={() => (zoom ? setZoom(null) : zoomIn())}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
          >
            {zoom ? "Zoom out" : "Zoom in"}
          </button>
          <button
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollerRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={`absolute inset-0 ${zoom ? "overflow-auto" : "overflow-hidden"}`}
          >
            {zoom ? (
              <div className="grid min-h-full w-max min-w-full place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution photo for zooming */}
                <img
                  ref={imgRef}
                  src={costume.src}
                  alt={name}
                  onClick={onPhotoClick}
                  draggable={false}
                  style={{ width: zoom.width }}
                  className="max-w-none cursor-grab select-none active:cursor-grabbing"
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- full-resolution photo for zooming
              <img
                ref={imgRef}
                src={costume.src}
                alt={name}
                onClick={onPhotoClick}
                draggable={false}
                className="absolute inset-0 size-full cursor-zoom-in object-contain select-none"
              />
            )}
          </div>
          <ArrowButton direction="prev" onClick={onPrev} />
          <ArrowButton direction="next" onClick={onNext} />
        </div>

        <div className="bg-white px-4 py-3 text-stone-900">
          {taken ? (
            <p className="font-medium text-stone-700">
              Sorry, this costume has already been taken.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className={`${entrance.color} h-10 w-1.5 shrink-0 rounded-full`}
                aria-hidden
              />
              <div>
                <p className="text-sm text-stone-500">Pick it up at</p>
                <p className="font-bold">
                  {entranceLabel(entrance)}
                  {entrance.sizes && (
                    <span className="font-normal text-stone-600">
                      {" "}
                      · {entrance.sizes}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous costume" : "Next costume"}
      className={`absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-3xl text-white ring-1 ring-white/30 backdrop-blur hover:bg-black/70 ${
        direction === "prev" ? "left-3" : "right-3"
      }`}
    >
      <span aria-hidden className="-mt-1">
        {direction === "prev" ? "‹" : "›"}
      </span>
    </button>
  );
}
