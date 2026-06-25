"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  revealFromBottom,
  revealFromLeft,
  revealFromRight,
  revealFromCenter,
  createFloatingAnimation,
  createDepthAnimation,
} from "@/utils/animations";

gsap.registerPlugin(ScrollTrigger);

type AnimationType =
  | "fromBottom"
  | "fromLeft"
  | "fromRight"
  | "fromCenter"
  | "floating"
  | "depth";

interface UseGsapAnimationOptions {
  animationType: AnimationType;
  delay?: number;
  trigger?: boolean;
  floatingOptions?: {
    yRange?: number;
    duration?: number;
  };
  depthOptions?: {
    scale?: number;
    zIndex?: number;
  };
}

export const useGsapAnimation = (options: UseGsapAnimationOptions) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let animation: gsap.core.Tween | gsap.core.Timeline;

    switch (options.animationType) {
      case "fromBottom":
        animation = revealFromBottom(element, options.delay);
        break;
      case "fromLeft":
        animation = revealFromLeft(element, options.delay);
        break;
      case "fromRight":
        animation = revealFromRight(element, options.delay);
        break;
      case "fromCenter":
        animation = revealFromCenter(element, options.delay);
        break;
      case "floating":
        animation = createFloatingAnimation(
          element,
          options.floatingOptions?.yRange,
          options.floatingOptions?.duration
        );
        break;
      case "depth":
        animation = createDepthAnimation(
          element,
          options.depthOptions?.scale,
          options.depthOptions?.zIndex
        );
        break;
      default:
        animation = revealFromBottom(element, options.delay);
    }

    if (options.trigger) {
      ScrollTrigger.create({
        trigger: element,
        start: "top 80%",
        animation,
        once: true,
      });
    }

    return () => {
      animation.kill();
    };
  }, [options]);

  return elementRef;
}; 