"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

const letters = "Cocktail".split("");

// Each image gets its own scattered "landing spot" (in world units,
// roughly centered but offset so they don't all converge to one point)
// plus which lane (left/right) it belongs to for the exit.
const panels = [
  { src: "/Hero/17262676116_8c01038595_o.webp", x: -180, y: 90, lane: "left" as const },
  { src: "/Hero/atmospheric-background-black-shadows-orange-260nw-2670220855.webp", x: 170, y: 130, lane: "right" as const },
  { src: "/Hero/black-and-white-1282260_640.jpg", x: -70, y: -50, lane: "left" as const },
  { src: "/Hero/d8ad7528191005.5637110d93902.jpg", x: 230, y: -30, lane: "right" as const },
  { src: "/Hero/woman-hiding-in-darkness-with-light-illuminating-face-photo.jpg", x: -220, y: 10, lane: "left" as const },
];

export default function Hero() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasContainer = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");

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
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    canvasContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const loader = new THREE.TextureLoader();

    const worldHeight =
      2 * Math.tan((Math.PI / 180) * camera.fov * 0.5) * camera.position.z;
    const worldWidth = worldHeight * camera.aspect;
    const belowTextY = -worldHeight * 1.05;

    const meshes = panels.map((panel) => {
      const geometry = new THREE.PlaneGeometry(500, 650, 16, 16);
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

    // ---- TWO INDEPENDENT, SIMULTANEOUS, CONTINUOUS LANES ----
    const enterDuration = 0.9;
    const holdDuration = 0.35;
    const exitDuration = 0.55;
    const cycleDuration = enterDuration + holdDuration + exitDuration;

    const leftItems = meshes.filter((m) => m.panel.lane === "left");
    const rightItems = meshes.filter((m) => m.panel.lane === "right");

    const allTimelines: gsap.core.Timeline[] = [];
    const allDelayedCalls: gsap.core.Tween[] = [];

    const launchLane = (items: typeof meshes, laneSide: -1 | 1) => {
      const laneStagger = cycleDuration / items.length;

      items.forEach(({ mesh, panel }, i) => {
        const exitX = panel.x + laneSide * worldWidth * 0.55;

        const buildCycleTl = () => {
          const tl = gsap.timeline({ repeat: -1 });

          tl.set(mesh.position, { x: panel.x, y: belowTextY, z: -250 });
          tl.set(mesh.scale, { x: 0.05, y: 0.05, z: 0.05 });
          tl.set(mesh.material, { opacity: 0 });

          // ENTER: rises straight up from below the text into its own scattered spot
          tl.to(mesh.position, { y: panel.y, z: 0, duration: enterDuration, ease: "power3.out" }, 0);
          tl.to(mesh.scale, { x: 1, y: 1, z: 1, duration: enterDuration, ease: "power3.out" }, 0);
          tl.to(mesh.material, { opacity: 1, duration: enterDuration * 0.65, ease: "power2.out" }, 0);

          // HOLD at its scattered spot
          tl.to({}, { duration: holdDuration });

          // SHOOT / EXIT: rushes toward camera along this lane's direction,
          // perspective balloons it on its own, fades right before the lens
          tl.to(mesh.position, { x: exitX, z: 1180, duration: exitDuration, ease: "power4.in" }, ">");
          tl.to(
            mesh.material,
            { opacity: 0, duration: exitDuration * 0.4, ease: "power2.in" },
            `>-${exitDuration * 0.4}`
          );

          return tl;
        };

        const dc = gsap.delayedCall(0.4 + i * laneStagger, () => {
          allTimelines.push(buildCycleTl());
        });
        allDelayedCalls.push(dc);
      });
    };

    // both lanes start at the same base moment and run forever, independently
    launchLane(leftItems, -1);
    launchLane(rightItems, 1);

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
      allTimelines.forEach((tl) => tl.kill());
      allDelayedCalls.forEach((dc) => dc.kill());
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
      <div ref={canvasRef} className="absolute inset-0" />
      <h1
        ref={textRef}
        className="
          hero-text
          text-white
          font-black
          leading-[0.8]
          tracking-[-0.08em]
          text-[20vw]
          select-none
          uppercase
          whitespace-nowrap
          absolute
          left-10
          bottom-10
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