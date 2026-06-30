"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

const letters = "OVA".split("");

// Each image gets its own scattered "landing spot" (in world units,
// roughly centered but offset so they don't all converge to one point)
// plus which lane (left/right) it belongs to for the exit, and its
// final scale/opacity so one image reads as the large "hero" panel
// and the rest sit smaller and fainter behind it.
const panels = [
  // Large box — top-left (your box 1)
  { src: "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp", x: -400, y: 30, z: 200, lane: "left" as const, scale: 1, opacity: 1 },
  // Medium box — overlapping right/below box 1 (your box 2)
  { src: "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp", x: -70, y: -55, z: 100, lane: "right" as const, scale: 0.9, opacity: 0.95 },
  // Smaller box — overlapping box 2, further down-right (your box 3)
  { src: "/Hero/places-to-visit-in-mumbai-e1547692412795.jpg", x: 20, y: -20, z: 20, lane: "left" as const, scale: 0.65, opacity: 0.9 },
  // Small box — top-right, separate (your box 4)
  { src: "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp", x: 340, y: 20, z: -40, lane: "right" as const, scale: 0.45, opacity: 0.85 },
  // Large-ish box — right side, separate (your box 5)
  { src: "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp", x: 235, y: -55, z: -100, lane: "left" as const, scale: 0.55, opacity: 0.85 },
  // Tiny box — bottom-right, separate (your box 6)
  { src: "/Hero/places-to-visit-in-mumbai-e1547692412795.jpg", x: 145, y: -110, z: -160, lane: "right" as const, scale: 0.3, opacity: 0.75 },

  // Repeats to keep the stream going — reuse the same six zones, slightly offset
  { src: "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp", x: -180, y: 50, z: -220, lane: "left" as const, scale: 1.1, opacity: 0.55 },
  { src: "/Hero/places-to-visit-in-mumbai-e1547692412795.jpg", x: -50, y: -10, z: -280, lane: "right" as const, scale: 0.8, opacity: 0.5 },
  { src: "/Hero/Gateway-monument-India-entrance-Mumbai-Harbour-coast.webp", x: 155, y: 35, z: -340, lane: "left" as const, scale: 0.4, opacity: 0.45 },
  { src: "/Hero/MAG-SEPT16-mumbai-brian-pineda.webp", x: 250, y: -40, z: -400, lane: "right" as const, scale: 0.5, opacity: 0.4 },
];

export default function Hero() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasContainer = canvasRef.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      5000
    );
    camera.position.set(0, 0, 1200);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.background = "transparent";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "10";
    canvasContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const loader = new THREE.TextureLoader();

    const worldHeight =
      2 * Math.tan((Math.PI / 180) * camera.fov * 0.5) * camera.position.z;
    const worldWidth = worldHeight * camera.aspect;
    const belowTextY = -worldHeight * 1.05;

    const meshes = panels.map((panel) => {
      const geometry = new THREE.PlaneGeometry(500, 500, 16, 16);
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      // rises straight up from below into its own scattered landing spot
      mesh.position.set(panel.x, belowTextY, -250);
      mesh.scale.set(0.05, 0.05, 0.05);
      scene.add(mesh);
      loader.load(panel.src, (tex) => {
        material.map = tex;
        material.needsUpdate = true;
      });
      return { mesh, panel };
    });

    const renderScene = () => renderer.render(scene, camera);
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderScene();
    };
    animate();

    // ---- TEXT REVEAL (once on mount) ----
    const textSpans = textRef.current?.querySelectorAll("span") ?? [];
    gsap.set(textSpans, { y: 80, opacity: 0 });
    gsap.to(textSpans, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
    });

    const enterDuration = 0.9;
    const exitDuration = 1.4;

    const masterTimeline = gsap.timeline();
    let latestExitEnd = 0;

    const spawnData = meshes.map(({ mesh, panel }, index) => {
      const startDelay = 0.25 + index * 0.14;
      return {
        mesh,
        panel,
        startDelay,
        exitX: panel.x + (panel.lane === "left" ? -1 : 1) * worldWidth * 0.55,
        index,
      };
    });

    spawnData.forEach(({ mesh, panel, startDelay, exitX, index }) => {
      const entryEnd = startDelay + enterDuration;
      const floatDelay = entryEnd;
      const floatDuration = 0.28;
      const exitDelay = floatDelay + floatDuration;
      const exitEnd = exitDelay + exitDuration;
      latestExitEnd = Math.max(latestExitEnd, exitEnd);
      const floatY = panel.y + (index % 2 === 0 ? 18 : -16);

      masterTimeline.set(mesh.position, { x: panel.x, y: belowTextY, z: panel.z - 320 }, startDelay);
      masterTimeline.set(mesh.scale, { x: 0.05, y: 0.05, z: 0.05 }, startDelay);
      masterTimeline.set(mesh.material, { opacity: 0 }, startDelay);

      // ENTER: rise into place
      masterTimeline.to(
        mesh.position,
        { y: panel.y, z: panel.z, duration: enterDuration, ease: "power3.out", overwrite: "auto" },
        startDelay
      );
      masterTimeline.to(
        mesh.scale,
        { x: panel.scale, y: panel.scale, z: panel.scale, duration: enterDuration, ease: "power3.out", overwrite: "auto" },
        startDelay
      );
      masterTimeline.to(
        mesh.material,
        { opacity: panel.opacity, duration: enterDuration * 0.65, ease: "power2.out", overwrite: "auto" },
        startDelay
      );

      // FLOAT: a brief drift before the slow exit begins
      masterTimeline.to(
        mesh.position,
        { y: floatY, duration: floatDuration, ease: "sine.inOut", overwrite: "auto" },
        floatDelay
      );

      // EXIT: slowly shoot outward and fade
      masterTimeline.to(
        mesh.position,
        { x: exitX, z: 1180, duration: exitDuration, ease: "power4.in", overwrite: "auto" },
        exitDelay
      );
      masterTimeline.to(
        mesh.material,
        { opacity: 0, duration: exitDuration * 0.7, ease: "power2.in", overwrite: "auto" },
        exitDelay + exitDuration * 0.25
      );
    });

    const returnDelay = latestExitEnd + 0.25;
    masterTimeline.to(
      meshes.map(({ mesh }) => mesh.position),
      {
        x: (i: number) => panels[i].x,
        y: (i: number) => panels[i].y,
        z: (i: number) => panels[i].z,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
      } as any,
      returnDelay
    );
    masterTimeline.to(
      meshes.map(({ mesh }) => mesh.scale),
      {
        x: (i: number) => panels[i].scale,
        y: (i: number) => panels[i].scale,
        z: (i: number) => panels[i].scale,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
      } as any,
      returnDelay
    );
    masterTimeline.to(
      meshes.map(({ mesh }) => mesh.material),
      {
        opacity: (i: number) => panels[i].opacity,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
      } as any,
      returnDelay
    );

    const resize = () => {
      const { clientWidth, clientHeight } = canvasContainer;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      masterTimeline.kill();
      renderer.dispose();
      meshes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      if (canvasContainer.contains(renderer.domElement)) {
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      className="w-full bg-black relative overflow-hidden"
      style={{ height: "100vh" }}
    >
      <div ref={canvasRef} className="absolute inset-0 z-10" />
      <h1
  ref={textRef}
  className="
    hero-text
    text-white
    font-black
    leading-[0.75]
    tracking-[-0.06em]
    text-[26vw]
    select-none
    uppercase
    whitespace-nowrap
    absolute
    left-10
    bottom-10
    z-20
  "
  style={{ fontFamily: "'Poppins', sans-serif" }}
>
  {letters.map((letter, index) => (
    <span key={`${letter}-${index}`} className="inline-block">
      {letter}
    </span>
  ))}
</h1>

<div className="absolute right-10 bottom-16 z-20 text-white max-w-sm">
  <p className="text-2xl md:text-3xl font-semibold leading-snug">
    Instantly Generate Stunning Product Images with AI
  </p>
</div>

    </section>
  );
}