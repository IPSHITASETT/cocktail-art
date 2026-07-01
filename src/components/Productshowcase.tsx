"use client";

import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

const sourceImages = [
  "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp",
  "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp",
  "/Hero/places-to-visit-in-mumbai-e1547692412795.jpg",
  "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp",
  "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp",
  "/Hero/places-to-visit-in-mumbai-e1547692412795.jpg",
  "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp",
];

const TRAIN_SIZE = 20; // barano holo - tight overlap e beshi car lagbe continuous flow er jonno

const trainCars = Array.from({ length: TRAIN_SIZE }, (_, i) => ({
  src: sourceImages[i % sourceImages.length], // same images repeat cycle e
}));

export default function ProductShowcase() {
  // Refs for the three lines of heading text (left, right‑dark, right‑clear)
  const lineRefs = useRef<HTMLSpanElement[]>([]);
  const carsRef = useRef<HTMLDivElement[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      /* ---------------------------------------------------------
         1️⃣ Heading lines — pinned + scroll‑scrubbed reveal.
         Scrolling into the section PINS it in place; each line
         slides up from the bottom + scales up + goes from dark
         to clear, driven directly by scroll progress (one line
         at a time). Once all three lines are revealed, the train
         of images animates in — then the pin releases and normal
         scrolling continues.
         --------------------------------------------------------- */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=400%", // covers text reveal + train + text exit
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          // markers: true, // uncomment while tuning to see start/end points
        },
      });

      lineRefs.current.forEach((line) => {
        if (!line) return;

        // No position param => sequential: each line only starts
        // once the previous one has fully finished animating in.
        tl.fromTo(
          line,
          {
            yPercent: 100,
            opacity: 0,
            scale: 0.85,
            color: "rgba(255,255,255,0.25)",
            transformOrigin: "left bottom",
          },
          {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power2.out",
          }
        ).to(
          line,
          {
            color: "rgba(255,255,255,1)",
            duration: 0.6,
            ease: "power1.inOut",
          },
          "<0.2" // clears shortly after the slide-up starts
        );
      });

      /* ---------------------------------------------------------
         2️⃣ Motion‑path train — starts only AFTER the last line
         ("Visualization") has fully revealed. Cars start small
         and faded (as if far away), grow to full size + opacity
         as they travel along the path (depth/zoom-in feel), and
         are tightly staggered so they overlap each other —
         each new card stacking on top of (partially covering)
         the previous one, like a layered deck.
         --------------------------------------------------------- */
      carsRef.current.forEach((car) => {
        if (!car) return;
        gsap.set(car, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.5 });
      });

      carsRef.current.forEach((car, i) => {
        if (!car) return;

        tl.fromTo(
          car,
          {
            opacity: 0,
            scale: 0.5,
          },
          {
            opacity: 1,
            scale: 1,
            motionPath: {
              path: "#trainPath",
              align: "#trainPath",
              alignOrigin: [0.5, 0.5],
              autoRotate: true,
              start: 0,
              end: 1,
            },
            duration: 1.2,
            ease: "none",
            onStart: () => {
              gsap.set(car, { zIndex: i }); // porer card ta age rakha card er upore boshbe
            },
          },
          // first car: no position param => sequential, so it only
          // starts once ALL the text tweens above have finished.
          // rest of the cars are tightly staggered so they overlap.
          i === 0 ? undefined : "<0.05"
        );
      });

      /* ---------------------------------------------------------
         3️⃣ Heading lines exit — same style as the reveal (scale +
         dark/clear), but reversed: each line slides OUT through
         the top, one at a time, right after the train finishes.
         --------------------------------------------------------- */
      lineRefs.current.forEach((line) => {
        if (!line) return;

        // Sequential again — each line only exits once the
        // previous one has fully left.
        tl.to(line, {
          yPercent: -100,
          opacity: 0,
          scale: 0.85,
          color: "rgba(255,255,255,0.25)",
          duration: 1,
          ease: "power2.in",
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[120vh] bg-black overflow-hidden"
    >
      {/* Heading — left aligned, above cards */}
      <div className="absolute left-[4%] top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <h2 className="font-black uppercase leading-[0.95] tracking-tight text-white text-[9vw]">
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

      {/* SVG path – hidden but used by GSAP motionPath */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 520"
        preserveAspectRatio="none"
      >
        <path
          id="trainPath"
          d="M -180,320 C 0,420 180,520 360,500 C 480,490 520,440 560,320 C 590,220 610,100 700,40 C 820,-30 1000,20 1400,30"
          fill="none"
          stroke="none"
        />
      </svg>

      {/* Train cards */}
      <div className="absolute inset-0 z-50">
        {trainCars.map((card, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) carsRef.current[i] = el;
            }}
            className="absolute w-[220px] h-[250px] md:w-[340px] md:h-[380px] rounded-2xl overflow-hidden"
            style={{
              left: 0,
              top: 0,
              border: "1.5px solid rgba(255,255,255,0.12)",
            }}
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