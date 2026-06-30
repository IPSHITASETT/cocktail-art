"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

const letters = "OVA".split("");

type ExitDir = "topLeft" | "left" | "top" | "bottom" | "right" | "topRight" | "bottomRight" | "centerRight";

// Each image gets its own scattered "landing spot" (in world units,
// roughly centered but offset so they don't all converge to one point),
// its final scale/opacity, and now an explicit exitDir that controls
// HOW it leaves the screen (instead of a generic left/right lane).
const panels: {
  src: string;
  x: number;
  y: number;
  z: number;
  exitDir: ExitDir;
  scale: number;
  opacity: number;
}[] = [
  // 1) Large box — exits TOP-LEFT, shifted lower (Remains fully opaque for main focus)
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: -400, y: 75, z: 200, exitDir: "topLeft", scale: 1, opacity: 1 },
  // 2) Medium box — exits LEFT, shifted lower (opacity lowered to 0.75 for premium look)
  { src: "/Hero/3356.jpg", x: -160, y: -115, z: 100, exitDir: "left", scale: 0.9, opacity: 0.75 },
  // 3) Smaller box — exits TOP CENTER, shifted lower (opacity lowered to 0.7)
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: 60, y: -265, z: 20, exitDir: "top", scale: 0.65, opacity: 0.7 },
  
  // 4) Small box — exits BOTTOM CENTER (opacity lowered to 0.6)
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: 340, y: 20, z: -40, exitDir: "bottom", scale: 0.45, opacity: 0.6 },
  // 5) Large-ish box — exits TOP CENTER (opacity lowered to 0.6)
  { src: "/Hero/3356.jpg", x: 235, y: -55, z: -100, exitDir: "top", scale: 0.55, opacity: 0.6 },
  // 6) Tiny box — exits BOTTOM CENTER (opacity lowered to 0.5)
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: 145, y: -110, z: -160, exitDir: "bottom", scale: 0.3, opacity: 0.5 },

  // Repeats to keep the stream going — exit to the right sides (opacity adjusted for depth)
  { src: "/Hero/3356.jpg", x: -180, y: 50, z: -220, exitDir: "topRight", scale: 1.1, opacity: 0.4 },
  { src: "/Hero/pngtree-car-driving-on-a-dark-road-image_16497858.jpg", x: -50, y: -10, z: -280, exitDir: "bottomRight", scale: 0.8, opacity: 0.35 },
  { src: "/Hero/2a127375494db18dd2647353158c6c4a.jpg", x: 155, y: 35, z: -340, exitDir: "centerRight", scale: 0.4, opacity: 0.3 },
  { src: "/Hero/3356.jpg", x: 250, y: -40, z: -400, exitDir: "topRight", scale: 0.5, opacity: 0.25 },
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

    // Custom shader for the 1st image only — reproduces the "clip-path strip
    // wipe, staggered from center" reveal style (like the GSAP clipPath demo).
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
      mesh.scale.set(0.01, 0.01, 0.01); // Initial scale set very small for smooth zoom-in
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

    // ---- TEXT REVEAL (once on mount) ----
    const textSpans = textRef.current?.querySelectorAll("span") ?? [];
    gsap.set(textSpans, { y: 80, opacity: 0 });
    const textTween = gsap.to(textSpans, {
      y: 0,
      opacity: 1,
      duration: 1.5,      // Slower animation duration
      ease: "power3.out",
      stagger: 0.2,       // Slower letter stagger
    });

    const masterTimeline = gsap.timeline();
    let latestExitEnd = 0;

    meshes.forEach(({ mesh, panel, uniforms }, index) => {
      const isFirst = index === 0;

      // ---- EXPLICIT FLUID RHYTHM CALCULATIONS ----
      let entryStart = 0;
      let thisEnterDuration = 0;
      let exitStart = 0;
      let thisExitDuration = 0;

      if (isFirst) {
        entryStart = 0.2;          // Starts revealing immediately alongside the text
        thisEnterDuration = 1.6;   // Slow & smooth entry reveal
        exitStart = 1.8;           // Starts exit IMMEDIATELY upon finishing reveal (no pause)
        thisExitDuration = 2.4;    // Slow, cinematic exit glide (ends at 4.2s)
      } else {
        // Remaining images start entering sequentially while the 1st image is still revealing
        entryStart = 1.0 + (index - 1) * 0.25; 
        thisEnterDuration = 0.8;
        // Remaining images start exiting sequentially DURING the 1st image's exit glide
        exitStart = 2.4 + (index - 1) * 0.18; 
        thisExitDuration = 1.2;
      }

      const exitEnd = exitStart + thisExitDuration;
      latestExitEnd = Math.max(latestExitEnd, exitEnd);

      if (isFirst) {
        // ---- ENTER (1st image only): strip-wipe reveal IN PLACE
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
        // ---- ENTER (images 2+): rise from below into place ----
        masterTimeline.set(mesh.position, { x: panel.x, y: belowTextY, z: panel.z }, entryStart);
        masterTimeline.set(mesh.scale, { x: 0.01, y: 0.01, z: 0.01 }, entryStart); // Start scale small (0.01)
        masterTimeline.set(mesh.material, { opacity: 0 }, entryStart);

        masterTimeline.to(
          mesh.position,
          { y: panel.y, duration: thisEnterDuration, ease: "power4.out", overwrite: "auto" }, // Premium deceleration curve
          entryStart
        );
        masterTimeline.to(
          mesh.scale,
          { x: panel.scale, y: panel.scale, z: panel.scale, duration: thisEnterDuration, ease: "power4.out", overwrite: "auto" }, // Scales up to target scale smoothly
          entryStart
        );
        masterTimeline.to(
          mesh.material,
          { opacity: panel.opacity, duration: thisEnterDuration * 0.8, ease: "power3.out", overwrite: "auto" }, // Fades in smoothly to the lowered opacity value
          entryStart
        );
      }

      // ---- EXIT: direction-based movement + grow + fade, all together ----
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
          // Exit exactly through top-center - uniform scaling to prevent stretching
          exitX = 0;
          exitY = worldHeight * 0.75;
          targetScaleX = (worldHeight / 500) * 1.25;
          targetScaleY = (worldHeight / 500) * 1.25; 
          break;

        case "bottom":
          // Exit exactly through bottom-center - uniform scaling to prevent stretching
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
          exitY = panel.y * 0.5; // pull closer to center-right y=0
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

    // ---- RETURN / REPEAT SEQUENCE ----
    const returnDelay = latestExitEnd + 0.4;
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
      meshes.filter((m) => !m.uniforms).map(({ mesh }) => mesh.material),
      {
        opacity: (i: number) => {
          const nonShaderPanels = panels.filter((_, idx) => idx !== 0);
          return nonShaderPanels[i].opacity;
        },
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
      } as any,
      returnDelay
    );
    if (meshes[0].uniforms) {
      const firstUniforms = meshes[0].uniforms;
      const returnFade = { value: 0 };
      masterTimeline.to(
        returnFade,
        {
          value: panels[0].opacity,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
          onUpdate: () => {
            firstUniforms.uOpacity.value = returnFade.value;
          },
        },
        returnDelay
      );
    }

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
      textTween.kill();
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
      {/* 3D Canvas Layer */}
      <div ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none" />

      {/* --- HUGE HERO TEXT LAYER (Poppins style, restored to baseline bottom-10) --- */}
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

      {/* --- TOP-RIGHT CONCEPT TEXT --- */}
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

      {/* --- BOTTOM-RIGHT PARAGRAPH --- */}
      <div className="absolute right-10 bottom-16 z-20 text-white max-w-sm text-right select-none">
        <p className="text-2xl md:text-3xl font-semibold leading-snug">
          Welcome to art Gallery
        </p>
      </div>
    </section>
  );
}