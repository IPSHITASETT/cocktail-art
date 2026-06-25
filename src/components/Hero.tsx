"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Hero() {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        {
          yPercent: 200,
          scaleY: 1.15,
          opacity: 1,
        },
        {
          yPercent: 0,
          scaleY: 1,
          duration: 1.8,
          ease: "power4.out",
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
  <section
    className="w-full bg-black relative flex items-center justify-center"
    style={{ height: '100vh' }}
  >
    <div className="overflow-hidden w-full flex justify-center border-2 border-red-500">
      <h1
        ref={textRef}
        className="
          hero-text
          text-white
          font-black
          leading-[0.8]
          tracking-[-0.08em]
          text-[14vw]
          select-none
          uppercase
          whitespace-nowrap
        "
      >
        HEYyyyyy
      </h1>
    </div>
  </section>
);
}