"use client";

import { useRef } from "react";
import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { revealTextLines } from "@/utils/animations";
import { useMotionPathTrain } from "@/hooks/useGsapAnimation";

// Same source images, cycled to build a 24-card train so the path
// always looks populated end-to-end. Replace src with real CGI renders
// whenever — the cycling logic doesn't care how many unique images exist.
const sourceImages = [
  "/Hero/black-and-white-1282260_640.jpg",
  "/Hero/17262676116_8c01038595_o.webp",
  "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp",
  "/Hero/d8ad7528191005.5637110d93902.jpg",
  "/Hero/17262676116_8c01038595_o.webp",
  "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp",
  "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg",
];

const TRAIN_SIZE = 24;
const trainCars = Array.from({ length: TRAIN_SIZE }, (_, i) => ({
  src: sourceImages[i % sourceImages.length],
}));

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<HTMLSpanElement[]>([]);
  const carsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // --- Text lines: rise from bottom on enter (unchanged) ---
      revealTextLines(lineRefs.current, 0.15);
    }, section);

    return () => ctx.revert();
  }, []);

  // --- Infinite MotionPath train along the wavy SVG curve below ---
  // Autoplay, no ScrollTrigger — same API shape as the GSAP MotionPathPlugin
  // demo (gsap.com/docs/v3/Plugins/MotionPathPlugin), repeat: -1, no yoyo.
  useMotionPathTrain({
    pathSelector: "#trainPath",
    carsRef,
    duration: 7,
    stagger: 0.22,
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Heading */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none">
        <h2 className="font-black uppercase leading-[0.95] tracking-tight text-white text-[6vw] whitespace-nowrap">
          <span className="block overflow-hidden">
            <span
              ref={(el) => {
                if (el) lineRefs.current[0] = el;
              }}
              className="inline-block"
            >
              Revolutionizing
            </span>
          </span>
          <span className="block overflow-hidden italic font-light">
            <span
              ref={(el) => {
                if (el) lineRefs.current[1] = el;
              }}
              className="inline-block"
            >
              Product
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              ref={(el) => {
                if (el) lineRefs.current[2] = el;
              }}
              className="inline-block"
            >
              Visualization
            </span>
          </span>
        </h2>
      </div>

      {/* Invisible SVG path the train follows — wavy S-curve,
          bottom-left to top-right, viewBox matches the viewport so
          the path scales with the section. */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
      >
        <path
          id="trainPath"
          d="M -100,750 C 250,650 350,500 550,480 C 750,460 700,300 950,260 C 1150,230 1300,150 1700,120"
          fill="none"
          stroke="none"
        />
      </svg>

      {/* Train cars — each one a small image card animated along #trainPath */}
      <div className="absolute inset-0 z-20">
        {trainCars.map((card, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) carsRef.current[i] = el;
            }}
            className="absolute w-[90px] h-[120px] md:w-[130px] md:h-[170px] rounded-xl overflow-hidden shadow-2xl border border-white/10"
            style={{ left: 0, top: 0 }}
          >
            <img
              src={card.src}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}