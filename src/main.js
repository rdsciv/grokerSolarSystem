import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  BODIES,
  visualDistance,
  formatPeriod,
  formatRotation,
} from "./data.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const SECONDS_PER_DAY = 86400;
const TRAIL_LENGTH = 180;

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  paused: false,
  /** Earth days advanced per real second */
  daysPerSecond: 1,
  simDays: 0,
  startDate: new Date("2024-01-01T00:00:00Z"),
  showOrbits: true,
  showLabels: true,
  showTrails: false,
  showAsteroids: true,
  focusId: "sun",
  fps: 60,
};

// Map slider 0–100 → days/sec (log-ish curve)
function sliderToSpeed(v) {
  if (v <= 0) return 0;
  // 1 → ~1 day/s, 50 → ~365, 100 → ~36500
  const t = v / 100;
  return Math.pow(10, t * 4.56) * 0.01; // ~0.01 … ~36500
}

function speedToLabel(dps) {
  if (dps <= 0) return "Paused";
  if (dps < 0.05) return `${(dps * 24).toFixed(1)} h / sec`;
  if (dps < 1.5) return `${dps.toFixed(2)} day / sec`;
  if (dps < 30) return `${dps.toFixed(1)} days / sec`;
  const years = dps / 365.25;
  if (years < 1.5) return `${years.toFixed(2)} yr / sec`;
  if (years < 50) return `${years.toFixed(1)} yr / sec`;
  return `${Math.round(years)} yr / sec`;
}

function speedToSlider(dps) {
  if (dps <= 0) return 0;
  return Math.min(100, (Math.log10(dps / 0.01) / 4.56) * 100);
}

// ─── Renderer & scene ────────────────────────────────────────────────────────
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040a);
scene.fog = new THREE.FogExp2(0x03040a, 0.00035);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 45, 90);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 6;
controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI * 0.95;
controls.target.set(0, 0, 0);

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.4,
  0.85
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ─── Lighting ────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x1a2030, 0.35);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xfff0d0, 2.8, 0, 0.45);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x4466aa, 0.15);
rimLight.position.set(-40, 20, -30);
scene.add(rimLight);

// ─── Starfield ───────────────────────────────────────────────────────────────
function createStarfield() {
  const count = 8000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Sphere distribution
    const r = 800 + Math.random() * 1200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Star temperature colors
    const t = Math.random();
    if (t < 0.15) color.setHSL(0.6, 0.4, 0.85); // blue-white
    else if (t < 0.35) color.setHSL(0.1, 0.5, 0.9); // warm
    else if (t < 0.45) color.setHSL(0.0, 0.6, 0.75); // red dwarf
    else color.setHSL(0.15, 0.05, 0.95); // white

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = 0.5 + Math.random() * 2.2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Distant milky-way band
  const bandCount = 2500;
  const bandPos = new Float32Array(bandCount * 3);
  const bandCol = new Float32Array(bandCount * 3);
  for (let i = 0; i < bandCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const elev = (Math.random() - 0.5) * 0.35;
    const r = 900 + Math.random() * 400;
    bandPos[i * 3] = r * Math.cos(angle) * Math.cos(elev);
    bandPos[i * 3 + 1] = r * Math.sin(elev) + (Math.random() - 0.5) * 80;
    bandPos[i * 3 + 2] = r * Math.sin(angle) * Math.cos(elev);
    const c = 0.55 + Math.random() * 0.35;
    bandCol[i * 3] = c * 0.85;
    bandCol[i * 3 + 1] = c * 0.9;
    bandCol[i * 3 + 2] = c;
  }
  const bandGeo = new THREE.BufferGeometry();
  bandGeo.setAttribute("position", new THREE.BufferAttribute(bandPos, 3));
  bandGeo.setAttribute("color", new THREE.BufferAttribute(bandCol, 3));
  const band = new THREE.Points(
    bandGeo,
    new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  band.rotation.z = 0.4;
  scene.add(band);

  return stars;
}

createStarfield();

// ─── Procedural textures ─────────────────────────────────────────────────────
function makePlanetTexture(baseColor, opts = {}) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const c = new THREE.Color(baseColor);

  // Base
  ctx.fillStyle = `#${c.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Noise bands / spots
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

  // Earth-like land
  if (opts.earth) {
    ctx.fillStyle = "rgba(60, 140, 70, 0.55)";
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.ellipse(x, y, 15 + Math.random() * 30, 8 + Math.random() * 18, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ice caps
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

function makeSunTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
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

// ─── Build solar system ──────────────────────────────────────────────────────
const bodyMeshes = new Map();
const orbitLines = new Map();
const trailLines = new Map();
const labelsEl = document.getElementById("labels");
const labelNodes = new Map();
const systemRoot = new THREE.Group();
scene.add(systemRoot);

function createOrbitLine(distance, color, eccentricity = 0) {
  const a = distance;
  const e = eccentricity;
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e; // focus offset
  const pts = [];
  const segments = 256;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(a * Math.cos(theta) - c, 0, b * Math.sin(theta)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  return line;
}

function createRings(planetRadius) {
  const inner = planetRadius * 1.35;
  const outer = planetRadius * 2.35;
  const geo = new THREE.RingGeometry(inner, outer, 128);
  // Flip UVs for double-side look
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const len = Math.sqrt(x * x + y * y);
    uv.setXY(i, (len - inner) / (outer - inner), 0.5);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, "rgba(220,200,160,0)");
  grad.addColorStop(0.1, "rgba(220,200,160,0.55)");
  grad.addColorStop(0.25, "rgba(180,160,120,0.25)");
  grad.addColorStop(0.4, "rgba(230,210,170,0.7)");
  grad.addColorStop(0.55, "rgba(160,140,100,0.3)");
  grad.addColorStop(0.75, "rgba(210,190,150,0.6)");
  grad.addColorStop(0.95, "rgba(200,180,140,0.4)");
  grad.addColorStop(1, "rgba(200,180,140,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function createBody(data) {
  const group = new THREE.Group();
  group.userData = { ...data };

  let mesh;

  if (data.id === "sun") {
    const geo = new THREE.SphereGeometry(data.radius, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      map: makeSunTexture(),
      color: 0xffffff,
    });
    mesh = new THREE.Mesh(geo, mat);

    // Glow shells
    const glowGeo = new THREE.SphereGeometry(data.radius * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    const coronaGeo = new THREE.SphereGeometry(data.radius * 1.55, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff7711,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Sprite glow
    const spriteMat = new THREE.SpriteMaterial({
      map: makeGlowSprite(),
      color: 0xffbb55,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(data.radius * 8, data.radius * 8, 1);
    group.add(sprite);
  } else {
    const geo = new THREE.SphereGeometry(data.radius, 48, 48);
    const tex = makePlanetTexture(data.color, {
      bands: data.hasBands,
      earth: data.id === "earth",
    });
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: data.hasBands ? 0.85 : 0.7,
      metalness: 0.05,
      color: 0xffffff,
    });
    mesh = new THREE.Mesh(geo, mat);

    // Atmosphere
    if (data.hasAtmosphere) {
      const atmGeo = new THREE.SphereGeometry(data.radius * 1.06, 32, 32);
      const atmMat = new THREE.MeshBasicMaterial({
        color: data.atmosphereColor || 0x88bbff,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(atmGeo, atmMat));
    }

    // Axial tilt
    mesh.rotation.z = THREE.MathUtils.degToRad(data.axialTilt || 0);

    if (data.hasRings) {
      const rings = createRings(data.radius);
      rings.rotation.x = -Math.PI / 2 + THREE.MathUtils.degToRad(data.axialTilt || 0) * 0.3;
      group.add(rings);
    }
  }

  group.add(mesh);
  group.userData.mesh = mesh;
  group.userData.meanAnomaly0 = Math.random() * Math.PI * 2;
  group.userData.trail = [];

  // Position
  if (data.distanceAU > 0) {
    const d = visualDistance(data.distanceAU);
    const e = data.eccentricity || 0;
    group.userData.semiMajor = d;
    group.userData.eccentricity = e;
    // initial position
    placeOnOrbit(group, group.userData.meanAnomaly0);

    const orbit = createOrbitLine(d, data.color, e);
    systemRoot.add(orbit);
    orbitLines.set(data.id, orbit);

    // Trail line
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(TRAIL_LENGTH * 3);
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    trail.visible = false;
    systemRoot.add(trail);
    trailLines.set(data.id, trail);
  }

  systemRoot.add(group);
  bodyMeshes.set(data.id, group);

  // DOM label
  const label = document.createElement("div");
  label.className = "planet-label";
  label.textContent = data.name;
  labelsEl.appendChild(label);
  labelNodes.set(data.id, label);

  return group;
}

function makeGlowSprite() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,230,160,1)");
  g.addColorStop(0.2, "rgba(255,180,60,0.55)");
  g.addColorStop(0.5, "rgba(255,120,20,0.15)");
  g.addColorStop(1, "rgba(255,80,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/** Keplerian placement from mean anomaly (approx via eccentric anomaly iteration) */
function placeOnOrbit(group, meanAnomaly) {
  const a = group.userData.semiMajor;
  const e = group.userData.eccentricity || 0;
  // Solve Kepler: M = E - e sin E
  let E = meanAnomaly;
  for (let i = 0; i < 6; i++) {
    E = meanAnomaly + e * Math.sin(E);
  }
  const x = a * (Math.cos(E) - e);
  const z = a * Math.sqrt(1 - e * e) * Math.sin(E);
  group.position.set(x, 0, z);
}

// Build all bodies
BODIES.forEach(createBody);

// Asteroid belt
let asteroidBelt = null;
function createAsteroidBelt() {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const inner = visualDistance(2.1);
  const outer = visualDistance(3.3);
  const col = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = inner + Math.random() * (outer - inner);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 1.2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;
    const shade = 0.35 + Math.random() * 0.4;
    col.setRGB(shade * 0.9, shade * 0.85, shade * 0.75);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    depthWrite: false,
  });
  asteroidBelt = new THREE.Points(geo, mat);
  asteroidBelt.userData.periodDays = 1500;
  systemRoot.add(asteroidBelt);
}
createAsteroidBelt();

// Earth's moon
const earthGroup = bodyMeshes.get("earth");
const moonGroup = new THREE.Group();
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.95,
    map: makePlanetTexture(0xaaaaaa),
  })
);
moonGroup.add(moonMesh);
moonGroup.userData = {
  id: "moon",
  name: "Moon",
  periodDays: 27.3,
  meanAnomaly0: 0,
  orbitRadius: 2.2,
};
earthGroup.add(moonGroup);

// ─── Camera focus ────────────────────────────────────────────────────────────
const focusTarget = new THREE.Vector3();
let focusLerp = 0;

function focusBody(id) {
  state.focusId = id;
  focusLerp = 0;
  updateFocusUI();
  document.querySelectorAll(".body-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === id);
  });
}

function updateFocusUI() {
  const data = BODIES.find((b) => b.id === state.focusId);
  if (!data) return;
  document.getElementById("focus-name").textContent = data.name;
  document.getElementById("info-type").textContent = data.type;
  document.getElementById("info-radius").textContent = data.realRadiusKm;
  document.getElementById("info-distance").textContent =
    data.distanceAU > 0 ? `${data.distanceAU} AU` : "—";
  document.getElementById("info-period").textContent = formatPeriod(data.periodDays);
  document.getElementById("info-day").textContent = formatRotation(data.rotationDays);
  document.getElementById("info-moons").textContent = data.moons;
  document.getElementById("focus-blurb").textContent = data.blurb;
}

// ─── HUD wiring ──────────────────────────────────────────────────────────────
const bodyList = document.getElementById("body-list");
BODIES.forEach((b) => {
  const btn = document.createElement("button");
  btn.className = "body-btn" + (b.id === "sun" ? " active" : "");
  btn.dataset.id = b.id;
  const swatch = document.createElement("span");
  swatch.className = "body-swatch";
  swatch.style.background = `#${new THREE.Color(b.color).getHexString()}`;
  swatch.style.color = `#${new THREE.Color(b.color).getHexString()}`;
  const meta = document.createElement("div");
  meta.className = "body-meta";
  meta.innerHTML = `<strong>${b.name}</strong><span>${b.type}</span>`;
  btn.append(swatch, meta);
  btn.addEventListener("click", () => focusBody(b.id));
  bodyList.appendChild(btn);
});

// Time controls
const speedSlider = document.getElementById("speed-slider");
const speedLabel = document.getElementById("speed-label");
const btnPause = document.getElementById("btn-pause");
const iconPause = document.getElementById("icon-pause");
const iconPlay = document.getElementById("icon-play");

function applySpeed(dps, updateSlider = true) {
  state.daysPerSecond = dps;
  state.paused = dps <= 0;
  speedLabel.textContent = speedToLabel(dps);
  if (updateSlider) speedSlider.value = String(speedToSlider(dps));
  iconPause.classList.toggle("hidden", state.paused);
  iconPlay.classList.toggle("hidden", !state.paused);
  btnPause.classList.toggle("paused", state.paused);

  // Preset chips
  document.querySelectorAll(".chip[data-speed]").forEach((chip) => {
    const s = Number(chip.dataset.speed);
    // active if roughly matching
    const match =
      (s === 0 && dps === 0) ||
      (s > 0 && Math.abs(Math.log10((dps || 0.001) / s)) < 0.15);
    chip.classList.toggle("active", match);
  });
}

// Default: ~1 year / sec for a lively view
applySpeed(365);

speedSlider.addEventListener("input", () => {
  applySpeed(sliderToSpeed(Number(speedSlider.value)), false);
});

btnPause.addEventListener("click", () => {
  if (state.paused) {
    applySpeed(state._lastSpeed || 365);
  } else {
    state._lastSpeed = state.daysPerSecond;
    applySpeed(0);
  }
});

document.getElementById("btn-reset").addEventListener("click", () => {
  state.simDays = 0;
  updateSimDate();
});

document.querySelectorAll(".chip[data-speed]").forEach((chip) => {
  chip.addEventListener("click", () => {
    applySpeed(Number(chip.dataset.speed));
  });
});

document.getElementById("toggle-orbits").addEventListener("change", (e) => {
  state.showOrbits = e.target.checked;
  orbitLines.forEach((line) => {
    line.visible = state.showOrbits;
  });
});

document.getElementById("toggle-labels").addEventListener("change", (e) => {
  state.showLabels = e.target.checked;
});

document.getElementById("toggle-trails").addEventListener("change", (e) => {
  state.showTrails = e.target.checked;
  trailLines.forEach((line) => {
    line.visible = state.showTrails;
  });
});

document.getElementById("toggle-asteroids").addEventListener("change", (e) => {
  state.showAsteroids = e.target.checked;
  if (asteroidBelt) asteroidBelt.visible = state.showAsteroids;
});

updateFocusUI();

// ─── Date display ────────────────────────────────────────────────────────────
function updateSimDate() {
  const d = new Date(state.startDate.getTime() + state.simDays * SECONDS_PER_DAY * 1000);
  const opts = { year: "numeric", month: "short", day: "numeric" };
  document.getElementById("sim-date").textContent = d.toLocaleDateString("en-US", opts);
}

// ─── Animation ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let fpsAccum = 0;
let fpsFrames = 0;
const _proj = new THREE.Vector3();
const _world = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // FPS
  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    state.fps = Math.round(fpsFrames / fpsAccum);
    document.getElementById("fps-value").textContent = String(state.fps);
    fpsAccum = 0;
    fpsFrames = 0;
  }

  // Advance simulation time
  if (!state.paused && state.daysPerSecond > 0) {
    state.simDays += state.daysPerSecond * dt;
    updateSimDate();
  }

  // Update bodies
  bodyMeshes.forEach((group, id) => {
    const data = group.userData;
    const mesh = data.mesh;

    // Orbit
    if (data.periodDays > 0 && data.semiMajor) {
      const n = (Math.PI * 2) / data.periodDays; // rad per day
      const M = data.meanAnomaly0 + n * state.simDays;
      placeOnOrbit(group, M);

      // Trails
      if (state.showTrails) {
        data.trail.push(group.position.clone());
        if (data.trail.length > TRAIL_LENGTH) data.trail.shift();
        const trail = trailLines.get(id);
        if (trail && data.trail.length > 1) {
          const pos = trail.geometry.attributes.position;
          for (let i = 0; i < TRAIL_LENGTH; i++) {
            const p = data.trail[Math.min(i, data.trail.length - 1)] || data.trail[0];
            if (i < data.trail.length) {
              pos.setXYZ(i, data.trail[i].x, data.trail[i].y, data.trail[i].z);
            } else {
              pos.setXYZ(i, p.x, p.y, p.z);
            }
          }
          // Proper packing from start
          for (let i = 0; i < data.trail.length; i++) {
            pos.setXYZ(i, data.trail[i].x, data.trail[i].y, data.trail[i].z);
          }
          trail.geometry.setDrawRange(0, data.trail.length);
          pos.needsUpdate = true;
        }
      }
    }

    // Spin
    if (mesh && data.rotationDays) {
      const spin = ((Math.PI * 2) / Math.abs(data.rotationDays)) * state.daysPerSecond * dt * Math.sign(data.rotationDays || 1);
      // When paused, still allow slow visual spin? No — freeze when paused
      if (!state.paused) {
        mesh.rotation.y += spin;
      }
    }
  });

  // Moon
  if (moonGroup) {
    const n = (Math.PI * 2) / moonGroup.userData.periodDays;
    const angle = moonGroup.userData.meanAnomaly0 + n * state.simDays;
    const r = moonGroup.userData.orbitRadius;
    moonGroup.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    if (!state.paused) moonMesh.rotation.y += 0.02 * state.daysPerSecond * dt;
  }

  // Asteroid belt slow rotation
  if (asteroidBelt && !state.paused) {
    asteroidBelt.rotation.y += ((Math.PI * 2) / 1500) * state.daysPerSecond * dt * 0.15;
  }

  // Camera focus follow
  const focus = bodyMeshes.get(state.focusId);
  if (focus) {
    focus.getWorldPosition(focusTarget);
    controls.target.lerp(focusTarget, 1 - Math.pow(0.001, dt));
  }

  controls.update();

  // Labels
  const showLabels = state.showLabels;
  labelNodes.forEach((el, id) => {
    const group = bodyMeshes.get(id);
    if (!group) return;
    group.getWorldPosition(_world);
    // Offset above body
    _world.y += (group.userData.radius || 1) * 1.4;
    _proj.copy(_world).project(camera);
    const visible =
      showLabels &&
      _proj.z < 1 &&
      _proj.x > -1.1 &&
      _proj.x < 1.1 &&
      _proj.y > -1.1 &&
      _proj.y < 1.1;
    if (visible) {
      const x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
      el.style.transform = `translate(-50%, -150%) translate(${x}px, ${y}px)`;
      el.classList.add("visible");
    } else {
      el.classList.remove("visible");
    }
  });

  // Subtle sun pulse
  const sun = bodyMeshes.get("sun");
  if (sun) {
    const pulse = 1 + Math.sin(performance.now() * 0.001) * 0.015;
    sun.scale.setScalar(pulse);
  }

  composer.render();
}

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.code === "Space") {
    e.preventDefault();
    btnPause.click();
  }
  if (e.key === "o" || e.key === "O") {
    const t = document.getElementById("toggle-orbits");
    t.checked = !t.checked;
    t.dispatchEvent(new Event("change"));
  }
  if (e.key === "l" || e.key === "L") {
    const t = document.getElementById("toggle-labels");
    t.checked = !t.checked;
    t.dispatchEvent(new Event("change"));
  }
});

updateSimDate();
animate();
