import * as THREE from "three";

export function makePlanetTexture(baseColor, opts = {}) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const c = new THREE.Color(baseColor);

  ctx.fillStyle = `#${c.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size;
    const h = 2 + Math.random() * (opts.bands ? 18 : 8);
    const shade = (Math.random() - 0.5) * (opts.bands ? 0.35 : 0.2);
    const nc = c.clone().offsetHSL(0, 0, shade);
    ctx.fillStyle = `rgba(${Math.floor(nc.r * 255)},${Math.floor(nc.g * 255)},${Math.floor(nc.b * 255)},${opts.bands ? 0.55 : 0.35})`;
    if (opts.bands) {
      ctx.fillRect(0, y, size, h);
    } else {
      const x = Math.random() * size;
      const r = 4 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (opts.earth) {
    ctx.fillStyle = "rgba(60, 140, 70, 0.55)";
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        15 + Math.random() * 30,
        8 + Math.random() * 18,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    const gradN = ctx.createLinearGradient(0, 0, 0, 40);
    gradN.addColorStop(0, "rgba(240,245,255,0.85)");
    gradN.addColorStop(1, "rgba(240,245,255,0)");
    ctx.fillStyle = gradN;
    ctx.fillRect(0, 0, size, 40);
    const gradS = ctx.createLinearGradient(0, size - 40, 0, size);
    gradS.addColorStop(0, "rgba(240,245,255,0)");
    gradS.addColorStop(1, "rgba(240,245,255,0.85)");
    ctx.fillStyle = gradS;
    ctx.fillRect(0, size - 40, size, 40);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function makeSunTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "#fff8e0");
  g.addColorStop(0.3, "#ffd060");
  g.addColorStop(0.65, "#ff9a20");
  g.addColorStop(1, "#e05000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 14;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,${180 + Math.random() * 60},${20 + Math.random() * 40},${0.15 + Math.random() * 0.25})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeGlowSprite() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(255,230,160,1)");
  g.addColorStop(0.2, "rgba(255,180,60,0.55)");
  g.addColorStop(0.5, "rgba(255,120,20,0.15)");
  g.addColorStop(1, "rgba(255,80,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
