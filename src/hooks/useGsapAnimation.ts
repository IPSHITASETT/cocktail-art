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
  createSnakePathAnimation,
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

/**
 * Drives the bento-stack "snake path" using ScrollTrigger scrub,
 * so the motion is 1:1 tied to scroll position (not autoplay).
 *
 * Usage: const stackRef = useSnakeScroll({ waypoints, scrollDistance });
 */
interface UseSnakeScrollOptions {
  waypoints: { x: number; y: number; rotate?: number }[];
  /** how much scroll distance (px) the whole path should take */
  scrollDistance?: number;
  /** ref to the element that should act as the pin/trigger (defaults to the moving element itself) */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const useSnakeScroll = (options: UseSnakeScrollOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    const trigger = options.triggerRef?.current ?? element;
    if (!element || !trigger) return;

    const tl = createSnakePathAnimation(element, options.waypoints);

    const st = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: `+=${options.scrollDistance ?? 1500}`,
      scrub: 1,
      pin: !options.triggerRef, // only self-pin if no external trigger passed
      animation: tl,
    });

    return () => {
      st.kill();
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.scrollDistance]);

  return elementRef;
};