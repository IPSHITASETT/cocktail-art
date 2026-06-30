"use client";

import { useRef, useLayoutEffect, useId } from "react";
import { gsap } from "gsap";

/* ------------------------------------------------------------------ */
/*  Standard GSAP "horizontalLoop" helper                             */
/* ------------------------------------------------------------------ */
function horizontalLoop(
  items: HTMLElement[],
  config: { speed?: number; reversed?: boolean; repeat?: number; paddingRight?: number } = {}
) {
  items = gsap.utils.toArray(items);
  const tl = gsap.timeline({
    repeat: config.repeat ?? -1,
    paused: true,
    defaults: { ease: "none" },
  });

  const length = items.length;
  const startX = items[0].offsetLeft;
  const times: number[] = [];
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed || 1) * 100;

  gsap.set(items, {
    xPercent: (i) => {
      const w = (widths[i] = parseFloat(String(gsap.getProperty(items[i], "width", "px"))));
      xPercents[i] =
        (parseFloat(String(gsap.getProperty(items[i], "x", "px"))) / w) * 100 +
        Number(gsap.getProperty(items[i], "xPercent"));
      return xPercents[i];
    },
  });
  gsap.set(items, { x: 0 });

  const curWidth = (() => {
    const last = items[length - 1];
    const lastX = (xPercents[length - 1] / 100) * widths[length - 1];
    return (
      last.offsetLeft +
      lastX -
      startX +
      widths[length - 1] * Number(gsap.getProperty(last, "scaleX")) +
      (config.paddingRight || 0)
    );
  })();

  for (let i = 0; i < length; i++) {
    const item = items[i];
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop = distanceToStart + widths[i] * Number(gsap.getProperty(item, "scaleX"));

    tl.to(
      item,
      { xPercent: ((curX - distanceToLoop) / widths[i]) * 100, duration: distanceToLoop / pixelsPerSecond },
      0
    )
      .fromTo(
        item,
        { xPercent: ((curX - distanceToLoop + curWidth) / widths[i]) * 100 },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + curWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);

    times[i] = distanceToStart / pixelsPerSecond;
  }

  tl.progress(1, true).progress(0, true);
  if (config.reversed) tl.reverse();
  return tl;
}

/* ------------------------------------------------------------------ */
/*  Images                                                            */
/* ------------------------------------------------------------------ */
const sourceImages = [
  "/Hero/black-and-white-1282260_640.jpg",
  "/Hero/17262676116_8c01038595_o.webp",
  "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp",
  "/Hero/d8ad7528191005.5637110d93902.jpg",
  "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg",
];

const buildLane = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => sourceImages[(i + offset) % sourceImages.length]);

interface LaneConfig {
  images: string[];
  direction: "left" | "right";
  speed: number;
}

const CARD_GAP = 16;
const CARD_WIDTH = 180; // fixed px width — critical so cards don't collapse before GSAP measures them

/* ------------------------------------------------------------------ */
/*  Single lane: infinite seamless horizontal loop                    */
/*  ALL positioning here is inline-style so it can never be stripped  */
/* ------------------------------------------------------------------ */
function Lane({ images, direction, speed }: LaneConfig) {
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
  const cards = cardRefs.current.filter(Boolean);
  if (!cards.length) return;

  const loop = horizontalLoop(cards, {
    repeat: -1,
    speed,
    reversed: direction === "right",
    paddingRight: CARD_GAP,
  });

  loop.play(); // <-- this was missing, timeline was paused forever

  return () => {
    loop.kill();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [direction, speed]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {images.map((src, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) cardRefs.current[i] = el;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: i * (CARD_WIDTH + CARD_GAP), // explicit left so offsetLeft is correct BEFORE gsap measures
            width: CARD_WIDTH,
            height: "100%",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            flexShrink: 0,
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CurvedBand — smooth arc via SVG clip-path, all inline styled      */
/* ------------------------------------------------------------------ */
function CurvedBand({
  rows,
  bow,
  rowHeight = 150,
  curveDepth = 60,
}: {
  rows: LaneConfig[];
  bow: "down" | "up";
  rowHeight?: number;
  curveDepth?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const gap = 12;
  const totalHeight = rowHeight * rows.length + gap * (rows.length - 1);
  const W = 1000;
  const H = totalHeight;

  const combinedPath =
    bow === "down"
      ? `M0,0 C ${W * 0.25},${curveDepth} ${W * 0.75},${curveDepth} ${W},0
         L${W},${H - curveDepth}
         C ${W * 0.75},${H} ${W * 0.25},${H} 0,${H - curveDepth} Z`
      : `M0,${curveDepth} C ${W * 0.25},0 ${W * 0.75},0 ${W},${curveDepth}
         L${W},${H}
         C ${W * 0.75},${H - curveDepth} ${W * 0.25},${H - curveDepth} 0,${H} Z`;

  return (
    <div style={{ position: "relative", width: "100%", height: totalHeight }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id={`clip-${uid}`} clipPathUnits="objectBoundingBox" transform={`scale(${1 / W}, ${1 / H})`}>
            <path d={combinedPath} />
          </clipPath>
        </defs>
      </svg>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "black",
          clipPath: `url(#clip-${uid})`,
          WebkitClipPath: `url(#clip-${uid})`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap,
            width: "100%",
            height: "100%",
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          {rows.map((row, i) => (
            <div key={i} style={{ width: "100%", height: rowHeight, flexShrink: 0 }}>
              <Lane {...row} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported section                                                  */
/* ------------------------------------------------------------------ */
export default function CurvedHorizontalGallery() {
  const rowA: LaneConfig = { images: buildLane(12, 0), direction: "left", speed: 1.0 };
  const rowB: LaneConfig = { images: buildLane(12, 2), direction: "right", speed: 1.0 };
  const rowC: LaneConfig = { images: buildLane(12, 1), direction: "left", speed: 1.0 };
  const rowD: LaneConfig = { images: buildLane(12, 3), direction: "right", speed: 1.0 };

  return (
    <section style={{ position: "relative", width: "100%", background: "black", padding: "40px 0", display: "flex", flexDirection: "column", gap: 32, overflow: "hidden" }}>
      <CurvedBand rows={[rowA, rowB]} bow="down" />
      <CurvedBand rows={[rowC, rowD]} bow="up" />
    </section>
  );
}