"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

const letters = "OVA".split("");

// Each image gets its own scattered "landing spot" (in world units,
// roughly centered but offset so they don't all converge to one point)
// plus which lane (left/right) it belongs to for the exit.
// Repeating images makes the stream last longer.
const panels = [
  { src: "/Hero/17262676116_8c01038595_o.webp", x: -260, y: 140, z: 20, lane: "left" as const },
  { src: "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp", x: 220, y: 170, z: 80, lane: "right" as const },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -110, y: -100, z: -30, lane: "left" as const },
  { src: "/Hero/d8ad7528191005.5637110d93902.jpg", x: 270, y: -20, z: 60, lane: "right" as const },
  { src: "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg", x: -240, y: 20, z: 120, lane: "left" as const },
  { src: "/Hero/17262676116_8c01038595_o.webp", x: -140, y: 90, z: -50, lane: "left" as const },
  { src: "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp", x: 190, y: 120, z: 40, lane: "right" as const },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -50, y: -140, z: -20, lane: "left" as const },
  { src: "/Hero/d8ad7528191005.5637110d93902.jpg", x: 280, y: -50, z: 100, lane: "right" as const },
  { src: "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg", x: -200, y: 50, z: 10, lane: "left" as const },
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
        { x: 1, y: 1, z: 1, duration: enterDuration, ease: "power3.out", overwrite: "auto" },
        startDelay
      );
      masterTimeline.to(
        mesh.material,
        { opacity: 1, duration: enterDuration * 0.65, ease: "power2.out", overwrite: "auto" },
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
        x: 1,
        y: 1,
        z: 1,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
      } as any,
      returnDelay
    );
    masterTimeline.to(
      meshes.map(({ mesh }) => mesh.material),
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
      },
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
          leading-[0.8]
          tracking-[-0.08em]
          text-[10vw]
          select-none
          uppercase
          whitespace-nowrap
          absolute
          left-30
          bottom-40
          z-20
        "
      >
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} className="inline-block">
            {letter}
          </span>
        ))}
      </h1>
    </section>
  );
}