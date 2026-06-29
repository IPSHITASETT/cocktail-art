import { gsap } from "gsap";

/**
 * Reusable GSAP animation helpers.
 * Each function returns a gsap.core.Tween or Timeline so it can be
 * killed/reversed by the caller (see useGsapAnimation.ts).
 */

export const revealFromBottom = (
  el: Element,
  delay = 0
): gsap.core.Tween => {
  return gsap.from(el, {
    y: 60,
    opacity: 0,
    duration: 1,
    delay,
    ease: "power3.out",
  });
};

export const revealFromLeft = (
  el: Element,
  delay = 0
): gsap.core.Tween => {
  return gsap.from(el, {
    x: -60,
    opacity: 0,
    duration: 1,
    delay,
    ease: "power3.out",
  });
};

export const revealFromRight = (
  el: Element,
  delay = 0
): gsap.core.Tween => {
  return gsap.from(el, {
    x: 60,
    opacity: 0,
    duration: 1,
    delay,
    ease: "power3.out",
  });
};

export const revealFromCenter = (
  el: Element,
  delay = 0
): gsap.core.Tween => {
  return gsap.from(el, {
    scale: 0.85,
    opacity: 0,
    duration: 1,
    delay,
    ease: "power3.out",
    transformOrigin: "50% 50%",
  });
};

export const createFloatingAnimation = (
  el: Element,
  yRange = 16,
  duration = 4
): gsap.core.Tween => {
  return gsap.to(el, {
    y: `+=${yRange}`,
    duration,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
};

export const createDepthAnimation = (
  el: Element,
  scale = 1.05,
  zIndex?: number
): gsap.core.Tween => {
  if (zIndex !== undefined) {
    gsap.set(el, { zIndex });
  }
  return gsap.to(el, {
    scale,
    duration: 3,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
};

/**
 * Creates a scroll-scrubbed "snake path" motion for a single element
 * (used here on the bento card-stack wrapper). The element travels
 * from bottom-left to top-right through a subtle zigzag — defined as
 * a series of waypoints — instead of a straight diagonal line.
 *
 * Returns a gsap.core.Timeline so the caller can hook it up to a
 * ScrollTrigger with `scrub` for direct scroll-control.
 *
 * @param el        the element to move (e.g. the stack wrapper div)
 * @param waypoints array of {x, y, rotate?} in px, relative offsets
 *                  from the element's starting position
 */
export const createSnakePathAnimation = (
  el: Element,
  waypoints: { x: number; y: number; rotate?: number }[]
): gsap.core.Timeline => {
  const tl = gsap.timeline();

  waypoints.forEach((point, i) => {
    tl.to(el, {
      x: point.x,
      y: point.y,
      rotate: point.rotate ?? 0,
      ease: "none", // linear — scrub controls the easing via scroll
      duration: 1,
    }, i);
  });

  return tl;
};

/**
 * Staggered text-line reveal (bottom -> up), used for the
 * "Revolutionizing / Product / Visualization" heading lines.
 */
export const revealTextLines = (
  els: Element[],
  stagger = 0.15
): gsap.core.Timeline => {
  const tl = gsap.timeline();
  tl.from(els, {
    y: "100%",
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger,
  });
  return tl;
};

/**
 * Drives an infinite "conveyor train" of elements along an SVG motion path —
 * exact GSAP MotionPathPlugin demo API (gsap.com/docs/v3/Plugins/MotionPathPlugin),
 * just repeat: -1 / no yoyo, plus a tight per-item stagger so 20+ images read
 * as one continuous stream flowing along the curve.
 *
 * @param els           array of elements (the train "cars") to animate
 * @param pathSelector  CSS selector of the SVG <path> to follow (e.g. "#trainPath")
 * @param duration      time (s) for ONE element to travel the full path
 * @param stagger       time (s) between each element's start (tight gap = small number)
 */
export const createMotionPathTrain = (
  els: Element[],
  pathSelector: string,
  duration = 6,
  stagger = 0.25
): gsap.core.Tween[] => {
  return els.map((el, i) =>
    gsap.to(el, {
      duration,
      repeat: -1,
      ease: "power1.inOut",
      delay: i * stagger,
      motionPath: {
        path: pathSelector,
        align: pathSelector,
        autoRotate: true,
        alignOrigin: [0.5, 0.5],
      },
    })
  );
};