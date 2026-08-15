"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COIN_IMG = "/images/usdxcoin.PNG";
const SCRIPT_TIMEOUT = 12000;

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function makeEnvTexture(THREE) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#111b3c");
  grad.addColorStop(0.45, "#0b1024");
  grad.addColorStop(0.55, "#251b48");
  grad.addColorStop(1, "#05070f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.save();
  ctx.translate(c.width * 0.78, c.height * 0.13);
  ctx.rotate(-0.55);
  const s1 = ctx.createLinearGradient(0, -130, 0, 130);
  s1.addColorStop(0, "rgba(255,214,130,0)");
  s1.addColorStop(0.5, "rgba(255,214,130,0.6)");
  s1.addColorStop(1, "rgba(255,214,130,0)");
  ctx.fillStyle = s1;
  ctx.fillRect(-65, -130, 130, 260);
  ctx.restore();

  ctx.save();
  ctx.translate(c.width * 0.16, c.height * 0.3);
  ctx.rotate(0.7);
  const s2 = ctx.createLinearGradient(0, -170, 0, 170);
  s2.addColorStop(0, "rgba(87,244,255,0)");
  s2.addColorStop(0.5, "rgba(87,244,255,0.5)");
  s2.addColorStop(1, "rgba(87,244,255,0)");
  ctx.fillStyle = s2;
  ctx.fillRect(-75, -170, 150, 340);
  ctx.restore();

  const b = ctx.createLinearGradient(0, c.height * 0.6, 0, c.height);
  b.addColorStop(0, "rgba(255,200,110,0)");
  b.addColorStop(1, "rgba(255,200,110,0.3)");
  ctx.fillStyle = b;
  ctx.fillRect(0, c.height * 0.6, c.width, c.height * 0.4);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function makeRadialTexture(THREE, inner, outer) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function makeFlareTexture(THREE) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(190,235,255,0.85)");
  g.addColorStop(0.4, "rgba(120,190,255,0.28)");
  g.addColorStop(0.75, "rgba(60,120,255,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = "lighter";
  const streak = ctx.createLinearGradient(0, 0, 512, 0);
  streak.addColorStop(0, "rgba(0,0,0,0)");
  streak.addColorStop(0.5, "rgba(200,235,255,0.7)");
  streak.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(0, 252, 512, 8);
  return new THREE.CanvasTexture(c);
}

function makeShaftTexture(THREE) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,224,160,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  const mask = ctx.createLinearGradient(0, 0, 64, 0);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(0.5, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 64, 512);
  return new THREE.CanvasTexture(c);
}

function computeCrop(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, c.width, c.height).data;
  } catch (err) {
    return null;
  }
  let minX = c.width;
  let maxX = 0;
  let minY = c.height;
  let maxY = 0;
  for (let y = 0; y < c.height; y += 1) {
    const row = y * c.width * 4;
    for (let x = 0; x < c.width; x += 1) {
      if (data[row + x * 4 + 3] > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return null;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2 + 6;
  const x0 = Math.max(0, Math.round(cx - half));
  const y0 = Math.max(0, Math.round(cy - half));
  const x1 = Math.min(c.width, Math.round(cx + half));
  const y1 = Math.min(c.height, Math.round(cy + half));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export default function CoinIntro({ onFinish }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const flashRef = useRef(null);
  const leavingRef = useRef(false);
  const disposedRef = useRef(false);
  const finishRef = useRef(onFinish);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  const startExit = useCallback((fast) => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      if (!disposedRef.current) finishRef.current();
    }, fast ? 700 : 1300);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas) return;

    document.body.classList.add("intro-mode");
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    let renderer = null;
    let scene = null;
    let camera = null;
    let coin = null;
    let faceMat = null;
    let rimMat = null;
    let rimRing = null;
    let glowMat = null;
    let cyanRingMat = null;
    let goldRingMat = null;
    let blueParts = null;
    let goldParts = null;
    let shafts = null;
    let pulseRing = null;
    let flare = null;
    let sparks = null;
    let rafId = 0;
    let idle = false;
    let gsapCtx = null;

    const build = () => {
      if (typeof window === "undefined" || !window.THREE || !window.gsap) return false;
      const THREE = window.THREE;
      const gsap = window.gsap;
      try {
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020309);

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 7.2);

        const keyLight = new THREE.SpotLight(0xffe0a8, 0, 26, 0.55, 0.65, 1.15);
        keyLight.position.set(3.2, 4.4, 4.6);
        keyLight.target.position.set(0, 0, 0);
        scene.add(keyLight, keyLight.target);

        const fillLight = new THREE.PointLight(0x57f4ff, 1.5, 26, 1.8);
        fillLight.position.set(-4.2, -1.4, 3.4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffd27f, 1.15);
        rimLight.position.set(0, 2.4, -6);
        scene.add(rimLight);

        const goldBack = new THREE.DirectionalLight(0x3a2d6e, 0.7);
        goldBack.position.set(-2, -3, -4);
        scene.add(goldBack);

        const ambient = new THREE.AmbientLight(0x2c2750, 0.55);
        scene.add(ambient);

        const envTex = makeEnvTexture(THREE);

        const textureLoader = new THREE.TextureLoader();
        const coinTex = textureLoader.load(COIN_IMG, (tex) => {
          if (tex.image && tex.image.width) {
            const crop = computeCrop(tex.image);
            if (crop) {
              coinTex.repeat.set(crop.w / tex.image.width, crop.h / tex.image.height);
              coinTex.offset.set(
                crop.x / tex.image.width,
                1 - (crop.y + crop.h) / tex.image.height
              );
              coinTex.needsUpdate = true;
            }
          }
        });
        coinTex.encoding = THREE.sRGBEncoding;
        coinTex.wrapS = THREE.ClampToEdgeWrapping;
        coinTex.wrapT = THREE.ClampToEdgeWrapping;

        coin = new THREE.Group();
        scene.add(coin);
        coin.scale.set(0.35, 0.35, 0.35);
        coin.position.set(0, -5.2, 0);

        rimMat = new THREE.MeshStandardMaterial({
          color: 0xf2b24a,
          metalness: 0.92,
          roughness: 0.24,
          envMap: envTex,
          envMapIntensity: 1.4,
          transparent: true,
          opacity: 0,
        });
        faceMat = new THREE.MeshStandardMaterial({
          map: coinTex,
          metalness: 0.6,
          roughness: 0.3,
          envMap: envTex,
          envMapIntensity: 1.15,
          transparent: true,
          opacity: 0,
        });
        const coinGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.18, 144, 1, false);
        const coinMesh = new THREE.Mesh(coinGeo, [rimMat, faceMat, faceMat.clone()]);
        coinMesh.rotation.x = Math.PI / 2;
        coin.add(coinMesh);

        rimRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.6, 0.024, 18, 160),
          rimMat.clone()
        );
        coin.add(rimRing);

        cyanRingMat = new THREE.MeshBasicMaterial({
          color: 0x57f4ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const cyanRing = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.012, 12, 160), cyanRingMat);
        coin.add(cyanRing);

        goldRingMat = new THREE.MeshBasicMaterial({
          color: 0xffd27f,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.01, 12, 160), goldRingMat);
        coin.add(goldRing);

        const glowTex = makeRadialTexture(THREE, "rgba(255,220,150,1)", "rgba(87,160,255,0)");
        glowMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: 0xffd9a0,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glowSprite = new THREE.Sprite(glowMat);
        glowSprite.scale.set(7.5, 7.5, 1);
        coin.add(glowSprite);

        const makeParticles = (count, color) => {
          const positions = new Float32Array(count * 3);
          for (let i = 0; i < count; i += 1) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          const material = new THREE.PointsMaterial({
            color,
            size: 0.035,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          return new THREE.Points(geometry, material);
        };
        blueParts = makeParticles(420, 0x57f4ff);
        goldParts = makeParticles(260, 0xffd27f);
        scene.add(blueParts, goldParts);

        const sparkTex = makeRadialTexture(THREE, "rgba(255,255,255,1)", "rgba(0,0,0,0)");
        sparks = [];
        for (let i = 0; i < 46; i += 1) {
          const s = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: sparkTex,
              color: Math.random() < 0.55 ? 0xffd27f : 0x7de9ff,
              transparent: true,
              opacity: 0,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          );
          s.scale.setScalar(0.09 + Math.random() * 0.12);
          s.visible = false;
          scene.add(s);
          sparks.push(s);
        }

        pulseRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.6, 0.045, 16, 200),
          new THREE.MeshBasicMaterial({
            color: 0x6de9ff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        pulseRing.visible = false;
        scene.add(pulseRing);

        const flareTex = makeFlareTexture(THREE);
        flare = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: flareTex,
            color: 0xbfe6ff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        flare.scale.set(5.5, 5.5, 1);
        scene.add(flare);

        const shaftTex = makeShaftTexture(THREE);
        shafts = [];
        for (let i = 0; i < 6; i += 1) {
          const sh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 7.5),
            new THREE.MeshBasicMaterial({
              map: shaftTex,
              transparent: true,
              opacity: 0.1,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              side: THREE.DoubleSide,
            })
          );
          sh.position.set(0, 0, -2.4);
          sh.rotation.z = (i / 6) * Math.PI;
          sh.rotation.y = 0.12;
          scene.add(sh);
          shafts.push(sh);
        }

        const floorTex = makeRadialTexture(THREE, "rgba(87,244,255,1)", "rgba(0,0,0,0)");
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(26, 26),
          new THREE.MeshBasicMaterial({
            map: floorTex,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -3.4;
        scene.add(floor);

        const resize = () => {
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", resize);

        const clock = new THREE.Clock();
        const render = () => {
          const dt = Math.min(clock.getDelta(), 0.05);
          const t = clock.elapsedTime;
          if (idle) {
            coin.rotation.y += dt * 0.28;
            coin.position.y = Math.sin(t * 0.6) * 0.12;
          }
          if (blueParts) {
            blueParts.rotation.y += dt * 0.02;
            goldParts.rotation.y -= dt * 0.015;
            goldParts.position.y = Math.sin(t * 0.5) * 0.18;
          }
          cyanRing.rotation.z += dt * 0.55;
          goldRing.rotation.z -= dt * 0.42;
          cyanRing.rotation.x = 0.12 + Math.sin(t * 0.7) * 0.08;
          pulseRing.rotation.z += dt * 1.2;
          for (let i = 0; i < shafts.length; i += 1) {
            shafts[i].material.opacity = 0.06 + Math.sin(t * 1.4 + i) * 0.03;
          }
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(render);
        };

        const burst = () => {
          const wp = new THREE.Vector3();
          coin.getWorldPosition(wp);
          pulseRing.visible = true;
          pulseRing.position.copy(wp);
          pulseRing.rotation.x = 0;
          pulseRing.rotation.y = 0;
          gsap.fromTo(
            pulseRing.scale,
            { x: 0.3, y: 0.3, z: 0.3 },
            { x: 3.4, y: 3.4, z: 3.4, duration: 1.5, ease: "power2.out" }
          );
          gsap.fromTo(
            pulseRing.material,
            { opacity: 0.95 },
            { opacity: 0, duration: 1.5, ease: "power1.out" }
          );

          flare.position.copy(wp).add(new THREE.Vector3(0, 0.2, 1.4));
          gsap.fromTo(flare.material, { opacity: 0 }, { opacity: 0.9, duration: 0.22, ease: "power2.out" });
          gsap.to(flare.material, { opacity: 0, duration: 1.0, delay: 0.35, ease: "power2.in" });

          for (let i = 0; i < sparks.length; i += 1) {
            const s = sparks[i];
            const angle = Math.random() * Math.PI * 2;
            const dir = new THREE.Vector3(
              Math.cos(angle),
              Math.sin(angle),
              (Math.random() - 0.5) * 0.9
            )
              .normalize()
              .multiplyScalar(2.4 + Math.random() * 2.2);
            s.position.copy(wp);
            s.visible = true;
            gsap.to(s.position, {
              x: wp.x + dir.x,
              y: wp.y + dir.y,
              z: wp.z + dir.z,
              duration: 1.1 + Math.random() * 0.8,
              ease: "power2.out",
            });
            gsap.fromTo(
              s.material,
              { opacity: 1 },
              {
                opacity: 0,
                duration: 0.9 + Math.random() * 0.5,
                ease: "power1.out",
                onComplete: () => {
                  s.visible = false;
                },
              }
            );
          }

          if (flashRef.current) {
            gsap.fromTo(flashRef.current, { opacity: 0.75 }, { opacity: 0, duration: 1.1, ease: "power1.out" });
          }
        };

        const enableIdle = () => {
          idle = true;
        };

        gsapCtx = gsap.context(() => {
          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
            onUpdate: () => {
              if (camera && coin) camera.lookAt(coin.position);
            },
            onComplete: () => startExit(false),
          });

          tl.to(keyLight, { intensity: 2.6, duration: 2.4, ease: "power1.inOut" }, 0)
            .to(coin.position, { y: 0, duration: 1.9, ease: "power3.out" }, 1.3)
            .to(coin.scale, { x: 1, y: 1, z: 1, duration: 1.7, ease: "power2.out" }, 1.3)
            .to(faceMat, { opacity: 1, duration: 1.7, ease: "power1.inOut" }, 1.3)
            .to(rimMat, { opacity: 1, duration: 1.7, ease: "power1.inOut" }, 1.3)
            .to(rimRing.material, { opacity: 1, duration: 1.7, ease: "power1.inOut" }, 1.3)
            .to(glowMat, { opacity: 0.5, duration: 2.2, ease: "power1.inOut" }, 1.5)
            .to(cyanRingMat, { opacity: 0.75, duration: 1.6 }, 2.6)
            .to(goldRingMat, { opacity: 0.4, duration: 1.6 }, 2.8)
            .to(coin.rotation, { x: -0.34, duration: 2.6, ease: "sine.inOut" }, 1.5)
            .to(camera.position, { z: 5.9, duration: 2.2, ease: "power1.inOut" }, 1.6)
            .to(camera.position, { y: 0.26, duration: 2.6, ease: "sine.inOut" }, 1.8)

            .to(coin.rotation, { y: -Math.PI * 2, duration: 3.6, ease: "power1.inOut" }, 3.3)
            .to(coin.rotation, { x: 0.44, duration: 2.2, ease: "sine.inOut" }, 3.8)
            .to(coin.rotation, { x: -0.2, duration: 2.4, ease: "sine.inOut" }, 5.7)
            .to(camera.position, { x: 0.8, duration: 3.4, ease: "power1.inOut" }, 3.6)
            .to(camera.position, { y: -0.3, duration: 3.4, ease: "power1.inOut" }, 3.6)
            .to(camera.position, { x: 0, duration: 2.8, ease: "power1.inOut" }, 6.8)

            .to(coin.rotation, { y: -Math.PI * 4, duration: 3.4, ease: "power1.inOut" }, 6.2)
            .to(camera.position, { z: 4.9, duration: 3.0, ease: "power1.inOut" }, 6.5)

            .to(camera.position, { z: 5.35, duration: 1.3, ease: "power1.inOut" }, 9.4)

            .to(coin.rotation, { y: -Math.PI * 6, duration: 1.5, ease: "power2.inOut" }, 10.3)
            .to(coin.position, { z: 2.0, duration: 1.35, ease: "power3.in" }, 10.3)
            .to(coin.scale, { x: 1.16, y: 1.16, z: 1.16, duration: 1.35, ease: "power3.in" }, 10.3)
            .add(burst, 10.75)

            .to(coin.position, { z: 0, duration: 1.7, ease: "power2.out" }, 11.8)
            .to(coin.scale, { x: 1, y: 1, z: 1, duration: 1.7, ease: "power2.out" }, 11.8)
            .to(coin.rotation, { x: -0.1, duration: 1.9, ease: "sine.inOut" }, 11.9)
            .to(camera.position, { z: 6.6, duration: 2.4, ease: "power2.inOut" }, 11.9)
            .to(camera.position, { x: 0, duration: 2.2, ease: "power2.inOut" }, 11.9)
            .to(camera.position, { y: 0.38, duration: 2.2, ease: "power2.inOut" }, 11.9)
            .call(enableIdle, null, 12.1)
            .to({}, { duration: 2.1 }, 12.2);
        }, overlay);

        resize();
        render();

        return () => {
          if (rafId) cancelAnimationFrame(rafId);
          window.removeEventListener("resize", resize);
          if (gsapCtx) gsapCtx.revert();
          if (scene) {
            scene.traverse((object) => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                const list = Array.isArray(object.material) ? object.material : [object.material];
                list.forEach((m) => {
                  if (m.map) m.map.dispose();
                  if (m.envMap) m.envMap.dispose();
                  m.dispose();
                });
              }
            });
          }
          if (renderer) renderer.dispose();
        };
      } catch (err) {
        console.error("CoinIntro init failed:", err);
        return false;
      }
    };

    const cleanup = () => {
      document.body.classList.remove("intro-mode");
      document.documentElement.style.overflow = prevOverflow;
      if (cleanupScene) cleanupScene();
      disposedRef.current = true;
    };

    let cleanupScene = null;
    let startedRef = false;

    const tryStart = () => {
      if (disposedRef.current || startedRef) return;
      if (!window.THREE || !window.gsap) return;
      startedRef = true;
      cleanupScene = build();
      if (!cleanupScene) startExit(true);
    };

    if (reducedMotion()) {
      const timer = window.setTimeout(() => startExit(true), 400);
      return () => {
        window.clearTimeout(timer);
        cleanup();
      };
    }

    tryStart();
    const poll = window.setInterval(() => {
      if (disposedRef.current || startedRef) {
        window.clearInterval(poll);
        return;
      }
      if (window.THREE && window.gsap) {
        window.clearInterval(poll);
        tryStart();
      }
    }, 150);
    const failTimer = window.setTimeout(() => {
      window.clearInterval(poll);
      if (!startedRef) startExit(true);
    }, SCRIPT_TIMEOUT);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(failTimer);
      cleanup();
    };
  }, [startExit]);

  return (
    <div className="intro-overlay" ref={overlayRef} role="dialog" aria-modal="true" aria-label="USDX coin reveal">
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-veil" ref={flashRef} aria-hidden="true" />
      <button type="button" className="intro-skip" onClick={() => startExit(true)}>
        SKIP INTRO <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
