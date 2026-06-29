"use client";

import { useRef } from "react";
import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { revealTextLines } from "@/utils/animations";

gsap.registerPlugin(ScrollTrigger);

// 7 cards — stacked tightly, slight fan/rotation for the bento look.
// Replace src with your real product/CGI renders.
const cards = [
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -10, y: 10, rotate: -6 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: 10, y: -6, rotate: 4 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -6, y: -14, rotate: -3 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: 14, y: 8, rotate: 7 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -14, y: 4, rotate: -8 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: 8, y: -10, rotate: 5 },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: 0, y: 0, rotate: 0 }, // front-most "hero" card
];

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<HTMLSpanElement[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stack = stackRef.current;
    if (!section || !stack) return;

    const ctx = gsap.context(() => {
      // --- Text lines: rise from bottom on enter ---
      revealTextLines(lineRefs.current, 0.15);

      // --- Build a smooth "ulto-S" path from bottom-left to top-right ---
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Start: bottom-left corner. End: top-right corner.
      // The curve dips through the middle like a reversed "S" —
      // first arcs slightly right-then-left, then sweeps up to the right.
      const startX = -vw * 0.34; // from center, how far left the stack starts
      const startY = vh * 0.34; // from center, how far down the stack starts
      const endX = vw * 0.34; // how far right it ends
      const endY = -vh * 0.34; // how far up it ends

      // Sequential waypoints the stack passes through to create the S-bend.
      const path = [
        { x: startX, y: startY, rotate: -6 }, // start (bottom-left)
        { x: startX * 0.45, y: startY * 0.2, rotate: -2 }, // curve inward/up first
        { x: 0, y: vh * 0.06, rotate: 0 }, // crosses center, slight dip (the "S" bend)
        { x: endX * 0.55, y: endY * 0.35, rotate: 3 }, // sweeps up toward the right
        { x: endX, y: endY, rotate: 6 }, // end (top-right)
      ];

      gsap.set(stack, { x: path[0].x, y: path[0].y, rotate: path[0].rotate });

      const tl = gsap.timeline();
      for (let i = 1; i < path.length; i++) {
        tl.to(
          stack,
          {
            x: path[i].x,
            y: path[i].y,
            rotate: path[i].rotate,
            ease: "none",
            duration: 1,
          },
          i - 1
        );
      }

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=2200",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        animation: tl,
      });
    }, section);

    return () => ctx.revert();
  }, []);

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

      {/* Bento card stack — travels bottom-left -> top-right along an "S" curve */}
      <div
        ref={stackRef}
        className="absolute top-1/2 left-1/2 z-20"
        style={{ marginLeft: "-170px", marginTop: "-220px" }} // half of card box, to center the transform origin
      >
        <div className="relative w-[280px] h-[360px] md:w-[340px] md:h-[440px]">
          {cards.map((card, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              style={{
                transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                zIndex: i,
              }}
            >
              {/* Using plain <img> here on purpose: these are dynamic
                  decorative renders, not LCP-critical content. Swap
                  for next/image once final asset paths are locked in. */}
              <img
                src={card.src}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}