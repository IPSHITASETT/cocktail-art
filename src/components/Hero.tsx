"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

const letters = "OVA".split("");

type ExitDir = "topLeft" | "left" | "top" | "bottom" | "right" | "topRight" | "bottomRight" | "centerRight";

const panels: {
  src: string;
  x: number;
  y: number;
  z: number;
  exitDir: ExitDir;
  scale: number;
  opacity: number;
}[] = [
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: -400, y: 75, z: 200, exitDir: "topLeft", scale: 1, opacity: 1 },
  { src: "/Hero/3356.jpg", x: -160, y: -115, z: 100, exitDir: "left", scale: 0.9, opacity: 0.75 },
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: 60, y: -265, z: 20, exitDir: "top", scale: 0.65, opacity: 0.7 },
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: 340, y: 20, z: -40, exitDir: "bottom", scale: 0.45, opacity: 0.6 },
  { src: "/Hero/3356.jpg", x: 235, y: -55, z: -100, exitDir: "top", scale: 0.55, opacity: 0.6 },
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: 145, y: -110, z: -160, exitDir: "bottom", scale: 0.3, opacity: 0.5 },
  { src: "/Hero/3356.jpg", x: -180, y: 50, z: -220, exitDir: "topRight", scale: 1.1, opacity: 0.4 },
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: -50, y: -10, z: -280, exitDir: "bottomRight", scale: 0.8, opacity: 0.35 },
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: 155, y: 35, z: -340, exitDir: "centerRight", scale: 0.4, opacity: 0.3 },
  { src: "/Hero/3356.jpg", x: 250, y: -40, z: -400, exitDir: "topRight", scale: 0.5, opacity: 0.25 },
];

export default function Hero() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLHeadingElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !sectionRef.current) return;

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

    const stripWipeVertex = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const stripWipeFragment = `
      uniform sampler2D map;
      uniform float uProgress;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float stripsCount = 10.0;
        float stripWidth = 1.0 / stripsCount;
        float stripIndex = floor(vUv.x / stripWidth);
        float center = (stripsCount - 1.0) / 2.0;
        float dist = abs(stripIndex - center);
        float maxDist = center;
        float delay = (dist / maxDist) * 0.55;
        float localProgress = clamp((uProgress - delay) / (1.0 - delay + 0.0001), 0.0, 1.0);
        float yFromCenter = abs(vUv.y - 0.5) * 2.0;
        if (yFromCenter > localProgress) discard;
        vec4 textColor = texture2D(map, vUv);
        gl_FragColor = vec4(textColor.rgb, textColor.a * uOpacity);
      }
    `;

    const meshes = panels.map((panel, index) => {
      const geometry = new THREE.PlaneGeometry(500, 500, 16, 16);

      if (index === 0) {
        const uniforms = {
          map: { value: null as THREE.Texture | null },
          uProgress: { value: 0 },
          uOpacity: { value: panel.opacity },
        };
        const material = new THREE.ShaderMaterial({
          vertexShader: stripWipeVertex,
          fragmentShader: stripWipeFragment,
          uniforms,
          transparent: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(panel.x, panel.y, panel.z);
        mesh.scale.set(panel.scale, panel.scale, panel.scale);
        scene.add(mesh);
        loader.load(panel.src, (tex) => {
          uniforms.map.value = tex;
          material.needsUpdate = true;
        });
        return { mesh, panel, uniforms };
      }

      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(panel.x, panel.y, panel.z);
      mesh.scale.set(0.01, 0.01, 0.01);
      scene.add(mesh);
      loader.load(panel.src, (tex) => {
        material.map = tex;
        material.needsUpdate = true;
      });
      return { mesh, panel, uniforms: null as null | { uProgress: { value: number }; uOpacity: { value: number } } };
    });

    const renderScene = () => renderer.render(scene, camera);
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderScene();
    };
    animate();

    // ---- TEXT INITIAL STATE (animation itself now lives inside masterTimeline below) ----
    const textSpans = textRef.current?.querySelectorAll("span") ?? [];
    gsap.set(textSpans, { y: 70, opacity: 0, scale: 0.94, filter: "blur(10px)" });

    // ---- MASTER TIMELINE (text + panels together) — paused, driven by scroll direction ----
    const masterTimeline = gsap.timeline({ paused: true });
    let latestExitEnd = 0;

    // Text reveal folded into the same timeline so it reverses/repeats WITH the panels
    textSpans.forEach((span, i) => {
      masterTimeline.to(
        span,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
        },
        i === 0 ? 0 : "-=0.18"
      );
    });

    meshes.forEach(({ mesh, panel, uniforms }, index) => {
      const isFirst = index === 0;

      let entryStart = 0;
      let thisEnterDuration = 0;
      let exitStart = 0;
      let thisExitDuration = 0;

      if (isFirst) {
        entryStart = 0.2;
        thisEnterDuration = 1.6;
        exitStart = 1.8;
        thisExitDuration = 2.4;
      } else {
        entryStart = 1.0 + (index - 1) * 0.25;
        thisEnterDuration = 0.8;
        exitStart = 2.4 + (index - 1) * 0.18;
        thisExitDuration = 1.2;
      }

      const exitEnd = exitStart + thisExitDuration;
      latestExitEnd = Math.max(latestExitEnd, exitEnd);

      if (isFirst) {
        masterTimeline.set(mesh.position, { x: panel.x, y: panel.y, z: panel.z }, entryStart);
        masterTimeline.set(mesh.scale, { x: panel.scale, y: panel.scale, z: panel.scale }, entryStart);

        if (uniforms) {
          const wipeProgress = { value: 0 };
          uniforms.uProgress.value = 0;
          uniforms.uOpacity.value = panel.opacity;
          masterTimeline.to(
            wipeProgress,
            {
              value: 1,
              duration: thisEnterDuration,
              ease: "power2.inOut",
              overwrite: "auto",
              onUpdate: () => {
                uniforms.uProgress.value = wipeProgress.value;
              },
            },
            entryStart
          );
        }
      } else {
        masterTimeline.set(mesh.position, { x: panel.x, y: belowTextY, z: panel.z }, entryStart);
        masterTimeline.set(mesh.scale, { x: 0.01, y: 0.01, z: 0.01 }, entryStart);
        masterTimeline.set(mesh.material, { opacity: 0 }, entryStart);

        masterTimeline.to(
          mesh.position,
          { y: panel.y, duration: thisEnterDuration, ease: "power4.out", overwrite: "auto" },
          entryStart
        );
        masterTimeline.to(
          mesh.scale,
          { x: panel.scale, y: panel.scale, z: panel.scale, duration: thisEnterDuration, ease: "power4.out", overwrite: "auto" },
          entryStart
        );
        masterTimeline.to(
          mesh.material,
          { opacity: panel.opacity, duration: thisEnterDuration * 0.8, ease: "power3.out", overwrite: "auto" },
          entryStart
        );
      }

      let exitX = panel.x;
      let exitY = panel.y;
      let exitZ = 1180;
      let targetScaleX = panel.scale;
      let targetScaleY = panel.scale;

      switch (panel.exitDir) {
        case "topLeft":
          exitX = panel.x - worldWidth * 0.6;
          exitY = panel.y + worldHeight * 0.75;
          targetScaleX = panel.scale * 1.6;
          targetScaleY = panel.scale * 1.6;
          break;

        case "left":
          exitX = panel.x - worldWidth * 0.65;
          exitY = panel.y;
          targetScaleX = panel.scale * 1.3;
          targetScaleY = (worldHeight / 500) * 1.05;
          break;

        case "top":
          exitX = 0;
          exitY = worldHeight * 0.75;
          targetScaleX = (worldHeight / 500) * 1.25;
          targetScaleY = (worldHeight / 500) * 1.25;
          break;

        case "bottom":
          exitX = 0;
          exitY = -worldHeight * 0.75;
          targetScaleX = (worldHeight / 500) * 1.25;
          targetScaleY = (worldHeight / 500) * 1.25;
          break;

        case "topRight":
          exitX = worldWidth * 0.65;
          exitY = worldHeight * 0.5;
          targetScaleX = panel.scale * 1.25;
          targetScaleY = panel.scale * 1.25;
          break;

        case "bottomRight":
          exitX = worldWidth * 0.65;
          exitY = -worldHeight * 0.5;
          targetScaleX = panel.scale * 1.25;
          targetScaleY = panel.scale * 1.25;
          break;

        case "centerRight":
        case "right":
        default:
          exitX = worldWidth * 0.65;
          exitY = panel.y * 0.5;
          targetScaleX = panel.scale * 1.12;
          targetScaleY = panel.scale * 1.12;
          break;
      }

      masterTimeline.to(
        mesh.position,
        { x: exitX, y: exitY, z: exitZ, duration: thisExitDuration, ease: isFirst ? "power2.inOut" : "power2.in", overwrite: "auto" },
        exitStart
      );
      masterTimeline.to(
        mesh.scale,
        {
          x: targetScaleX,
          y: targetScaleY,
          duration: thisExitDuration,
          ease: isFirst ? "power1.inOut" : "power1.in",
          overwrite: "auto",
        },
        exitStart
      );
      if (uniforms) {
        const fadeObj = { value: panel.opacity };
        masterTimeline.to(
          fadeObj,
          {
            value: 0,
            duration: thisExitDuration * 0.75,
            ease: "power2.inOut",
            overwrite: "auto",
            onUpdate: () => {
              uniforms.uOpacity.value = fadeObj.value;
            },
          },
          exitStart + thisExitDuration * 0.25
        );
      } else {
        masterTimeline.to(
          mesh.material,
          { opacity: 0, duration: thisExitDuration * 0.75, ease: "power2.in", overwrite: "auto" },
          exitStart + thisExitDuration * 0.2
        );
      }
    });

    // ---- SCROLL-DIRECTION DRIVEN PLAYBACK ----
    // scroll down into the section (from top, OR re-entering after a reverse) -> play forward
    // scroll back up into the section (re-entering from the next section below) -> reverse smoothly
    const heroTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom top",
      onEnter: () => masterTimeline.play(),
      onEnterBack: () => masterTimeline.reverse(),
    });

    // Hero is already in view on mount — kick off the very first play directly
    // (covers the case where the trigger's start point is already satisfied
    // at creation time, so onEnter may not fire on its own).
    masterTimeline.play();

    const resize = () => {
      const { clientWidth, clientHeight } = canvasContainer;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      masterTimeline.kill();
      heroTrigger.kill();
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
      ref={sectionRef}
      className="w-full bg-black relative overflow-hidden"
      style={{ height: "100vh" }}
    >
      <div ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none" />

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
          z-10
        "
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} className="inline-block">
            {letter}
          </span>
        ))}
      </h1>

      <div className="absolute top-10 right-10 z-20 flex gap-12 text-white select-none">
        <div className="flex flex-col gap-1 text-[11px] font-mono tracking-wider text-right">
          <span className="text-neutral-500">01 / CONCEPT</span>
          <span className="text-neutral-300 font-bold uppercase leading-tight">
            IMAGINATION<br />TO REALITY
          </span>
        </div>

        <div className="flex flex-col gap-1 text-[11px] font-mono tracking-wider text-right">
          <span className="text-neutral-500">02 / PLATFORM</span>
          <span className="text-neutral-300 font-bold uppercase leading-tight">
            NEXT-GEN<br />STUDIO
          </span>
        </div>
      </div>
    </section>
  );
}