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