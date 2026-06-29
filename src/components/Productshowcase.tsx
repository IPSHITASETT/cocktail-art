"use client";

import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { revealTextLines } from "@/utils/animations";

gsap.registerPlugin(MotionPathPlugin);

const sourceImages = [
  "/Hero/black-and-white-1282260_640.jpg",
  "/Hero/17262676116_8c01038595_o.webp",
  "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp",
  "/Hero/d8ad7528191005.5637110d93902.jpg",
  "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg",
  "/Hero/17262676116_8c01038595_o.webp",
  "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp",
];

const TRAIN_SIZE = 13;

const trainCars = Array.from({ length: TRAIN_SIZE }, (_, i) => ({
  src: sourceImages[i % sourceImages.length],
}));

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs   = useRef<HTMLSpanElement[]>([]);
  const carsRef    = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Text reveal
      revealTextLines(lineRefs.current, 0.15);

      // Motion path train
      carsRef.current.forEach((car, i) => {
        if (!car) return;

        const startProgress = i / TRAIN_SIZE;

        gsap.set(car, { xPercent: -50, yPercent: -50 });

        gsap.to(car, {
          motionPath: {
            path: "#trainPath",
            align: "#trainPath",
            alignOrigin: [0.5, 0.5],
            autoRotate: true,
            start: startProgress,
            end: startProgress + 1,
          },
          duration: 10,
          ease: "none",
          repeat: -1,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Heading — left aligned, above cards */}
      <div className="absolute left-[4%] top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <h2 className="font-black uppercase leading-[0.95] tracking-tight text-white text-[6.5vw]">
          <span className="block overflow-hidden">
            <span
              ref={(el) => { if (el) lineRefs.current[0] = el; }}
              className="inline-block"
            >
              Revolutionizing
            </span>
          </span>
          <span className="block overflow-hidden italic font-light">
            <span
              ref={(el) => { if (el) lineRefs.current[1] = el; }}
              className="inline-block"
            >
              Product
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              ref={(el) => { if (el) lineRefs.current[2] = el; }}
              className="inline-block"
            >
              Visualization
            </span>
          </span>
        </h2>
      </div>

      {/*
        SVG path — matches your drawn curve:
        starts bottom-left → dips into U-bowl → shoots up steeply
        through center → flattens out to top-right
      */}
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
      <div className="absolute inset-0 z-10">
        {trainCars.map((card, i) => (
          <div
            key={i}
            ref={(el) => { if (el) carsRef.current[i] = el; }}
            className="absolute w-[130px] h-[170px] md:w-[185px] md:h-[260px] rounded-2xl overflow-hidden"
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