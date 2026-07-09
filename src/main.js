import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  BODIES,
  formatPeriod,
  formatRotation,
} from "./data.js";
import { sliderToSpeed, speedToLabel, speedToSlider } from "./time.js";
import { createStarfield } from "./starfield.js";
import {
  buildSolarSystem,
  placeOnOrbit,
  TRAIL_LENGTH,
} from "./solarSystem.js";
import { readUrlState, writeUrlState } from "./urlState.js";

// ─── Constants ───────────────────────────────────────────────────────────────
const SECONDS_PER_DAY = 86400;

// ─── State ───────────────────────────────────────────────────────────────────
const defaults = {
  focusId: "sun",
  daysPerSecond: 365,
  showOrbits: true,
  showLabels: true,
  showTrails: false,
  showAsteroids: true,
};

const fromUrl = readUrlState(defaults);

const state = {
  paused: fromUrl.daysPerSecond <= 0,
  daysPerSecond: fromUrl.daysPerSecond,
  simDays: 0,
  startDate: new Date("2024-01-01T00:00:00Z"),
  showOrbits: fromUrl.showOrbits,
  showLabels: fromUrl.showLabels,
  showTrails: fromUrl.showTrails,
  showAsteroids: fromUrl.showAsteroids,
  focusId: BODIES.some((b) => b.id === fromUrl.focusId)
    ? fromUrl.focusId
    : "sun",
  fps: 60,
  _lastSpeed: fromUrl.daysPerSecond > 0 ? fromUrl.daysPerSecond : 365,
  _urlTimer: null,
};

function scheduleUrlWrite() {
  clearTimeout(state._urlTimer);
  state._urlTimer = setTimeout(() => writeUrlState(state), 150);
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
scene.add(new THREE.AmbientLight(0x1a2030, 0.35));
const sunLight = new THREE.PointLight(0xfff0d0, 2.8, 0, 0.45);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);
const rimLight = new THREE.DirectionalLight(0x4466aa, 0.15);
rimLight.position.set(-40, 20, -30);
scene.add(rimLight);

createStarfield(scene);

const {
  bodyMeshes,
  orbitLines,
  trailLines,
  labelNodes,
  asteroidBelt,
  moonGroup,
  moonMesh,
} = buildSolarSystem(scene);

// Apply initial visibility from URL
orbitLines.forEach((line) => {
  line.visible = state.showOrbits;
});
trailLines.forEach((line) => {
  line.visible = state.showTrails;
});
if (asteroidBelt) asteroidBelt.visible = state.showAsteroids;

// ─── Camera focus ────────────────────────────────────────────────────────────
const focusTarget = new THREE.Vector3();

function focusBody(id, { syncUrl = true } = {}) {
  if (!bodyMeshes.has(id)) return;
  state.focusId = id;
  updateFocusUI();
  document.querySelectorAll(".body-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === id);
  });
  if (syncUrl) scheduleUrlWrite();
}

function updateFocusUI() {
  const data = BODIES.find((b) => b.id === state.focusId);
  if (!data) return;
  document.getElementById("focus-name").textContent = data.name;
  document.getElementById("info-type").textContent = data.type;
  document.getElementById("info-radius").textContent = data.realRadiusKm;
  document.getElementById("info-distance").textContent =
    data.distanceAU > 0 ? `${data.distanceAU} AU` : "—";
  document.getElementById("info-period").textContent = formatPeriod(
    data.periodDays
  );
  document.getElementById("info-day").textContent = formatRotation(
    data.rotationDays
  );
  document.getElementById("info-moons").textContent = data.moons;
  document.getElementById("focus-blurb").textContent = data.blurb;
}

// ─── HUD wiring ──────────────────────────────────────────────────────────────
const bodyList = document.getElementById("body-list");
BODIES.forEach((b) => {
  const btn = document.createElement("button");
  btn.className = "body-btn" + (b.id === state.focusId ? " active" : "");
  btn.dataset.id = b.id;
  const swatch = document.createElement("span");
  swatch.className = "body-swatch";
  const hex = `#${new THREE.Color(b.color).getHexString()}`;
  swatch.style.background = hex;
  swatch.style.color = hex;
  const meta = document.createElement("div");
  meta.className = "body-meta";
  meta.innerHTML = `<strong>${b.name}</strong><span>${b.type}</span>`;
  btn.append(swatch, meta);
  btn.addEventListener("click", () => focusBody(b.id));
  bodyList.appendChild(btn);
});

const speedSlider = document.getElementById("speed-slider");
const speedLabel = document.getElementById("speed-label");
const btnPause = document.getElementById("btn-pause");
const iconPause = document.getElementById("icon-pause");
const iconPlay = document.getElementById("icon-play");

function applySpeed(dps, { updateSlider = true, syncUrl = true } = {}) {
  state.daysPerSecond = dps;
  state.paused = dps <= 0;
  if (dps > 0) state._lastSpeed = dps;
  speedLabel.textContent = speedToLabel(dps);
  if (updateSlider) speedSlider.value = String(speedToSlider(dps));
  iconPause.classList.toggle("hidden", state.paused);
  iconPlay.classList.toggle("hidden", !state.paused);
  btnPause.classList.toggle("paused", state.paused);

  document.querySelectorAll(".chip[data-speed]").forEach((chip) => {
    const s = Number(chip.dataset.speed);
    const match =
      (s === 0 && dps === 0) ||
      (s > 0 && Math.abs(Math.log10((dps || 0.001) / s)) < 0.15);
    chip.classList.toggle("active", match);
  });

  if (syncUrl) scheduleUrlWrite();
}

applySpeed(state.daysPerSecond, { syncUrl: false });
writeUrlState(state);

speedSlider.addEventListener("input", () => {
  applySpeed(sliderToSpeed(Number(speedSlider.value)), { updateSlider: false });
});

btnPause.addEventListener("click", () => {
  if (state.paused) {
    applySpeed(state._lastSpeed || 365);
  } else {
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

function bindToggle(id, key, onChange) {
  const el = document.getElementById(id);
  el.checked = state[key];
  el.addEventListener("change", (e) => {
    state[key] = e.target.checked;
    onChange?.(e.target.checked);
    scheduleUrlWrite();
  });
}

bindToggle("toggle-orbits", "showOrbits", (v) => {
  orbitLines.forEach((line) => {
    line.visible = v;
  });
});
bindToggle("toggle-labels", "showLabels");
bindToggle("toggle-trails", "showTrails", (v) => {
  trailLines.forEach((line) => {
    line.visible = v;
  });
});
bindToggle("toggle-asteroids", "showAsteroids", (v) => {
  if (asteroidBelt) asteroidBelt.visible = v;
});

// Share button
const btnShare = document.getElementById("btn-share");
if (btnShare) {
  btnShare.addEventListener("click", async () => {
    writeUrlState(state);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Cosmos — Solar System",
          text: `Viewing ${state.focusId} in Cosmos`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        btnShare.classList.add("copied");
        const label = btnShare.querySelector(".share-label");
        if (label) {
          const prev = label.textContent;
          label.textContent = "Copied";
          setTimeout(() => {
            label.textContent = prev;
            btnShare.classList.remove("copied");
          }, 1600);
        }
      }
    } catch {
      // user cancelled share
    }
  });
}

updateFocusUI();

// ─── Date display ────────────────────────────────────────────────────────────
function updateSimDate() {
  const d = new Date(
    state.startDate.getTime() + state.simDays * SECONDS_PER_DAY * 1000
  );
  const opts = { year: "numeric", month: "short", day: "numeric" };
  document.getElementById("sim-date").textContent = d.toLocaleDateString(
    "en-US",
    opts
  );
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

  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    state.fps = Math.round(fpsFrames / fpsAccum);
    document.getElementById("fps-value").textContent = String(state.fps);
    fpsAccum = 0;
    fpsFrames = 0;
  }

  if (!state.paused && state.daysPerSecond > 0) {
    state.simDays += state.daysPerSecond * dt;
    updateSimDate();
  }

  bodyMeshes.forEach((group, id) => {
    const data = group.userData;
    const mesh = data.mesh;

    if (data.periodDays > 0 && data.semiMajor) {
      const n = (Math.PI * 2) / data.periodDays;
      const M = data.meanAnomaly0 + n * state.simDays;
      placeOnOrbit(group, M);

      if (state.showTrails) {
        data.trail.push(group.position.clone());
        if (data.trail.length > TRAIL_LENGTH) data.trail.shift();
        const trail = trailLines.get(id);
        if (trail && data.trail.length > 1) {
          const pos = trail.geometry.attributes.position;
          for (let i = 0; i < data.trail.length; i++) {
            pos.setXYZ(
              i,
              data.trail[i].x,
              data.trail[i].y,
              data.trail[i].z
            );
          }
          trail.geometry.setDrawRange(0, data.trail.length);
          pos.needsUpdate = true;
        }
      }
    }

    if (mesh && data.rotationDays && !state.paused) {
      const spin =
        ((Math.PI * 2) / Math.abs(data.rotationDays)) *
        state.daysPerSecond *
        dt *
        Math.sign(data.rotationDays || 1);
      mesh.rotation.y += spin;
    }
  });

  if (moonGroup) {
    const n = (Math.PI * 2) / moonGroup.userData.periodDays;
    const angle = moonGroup.userData.meanAnomaly0 + n * state.simDays;
    const r = moonGroup.userData.orbitRadius;
    moonGroup.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    if (!state.paused) {
      moonMesh.rotation.y += 0.02 * state.daysPerSecond * dt;
    }
  }

  if (asteroidBelt && !state.paused) {
    asteroidBelt.rotation.y +=
      ((Math.PI * 2) / 1500) * state.daysPerSecond * dt * 0.15;
  }

  const focus = bodyMeshes.get(state.focusId);
  if (focus) {
    focus.getWorldPosition(focusTarget);
    controls.target.lerp(focusTarget, 1 - Math.pow(0.001, dt));
  }

  controls.update();

  const showLabels = state.showLabels;
  labelNodes.forEach((el, id) => {
    const group = bodyMeshes.get(id);
    if (!group) return;
    group.getWorldPosition(_world);
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

  const sun = bodyMeshes.get("sun");
  if (sun) {
    const pulse = 1 + Math.sin(performance.now() * 0.001) * 0.015;
    sun.scale.setScalar(pulse);
  }

  composer.render();
}

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});

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
  if (e.key === "s" || e.key === "S") {
    if (e.metaKey || e.ctrlKey) return;
    btnShare?.click();
  }
});

// Browser back/forward for shareable state
window.addEventListener("popstate", () => {
  const next = readUrlState(defaults);
  if (BODIES.some((b) => b.id === next.focusId)) {
    focusBody(next.focusId, { syncUrl: false });
  }
  applySpeed(next.daysPerSecond, { syncUrl: false });
  state.showOrbits = next.showOrbits;
  state.showLabels = next.showLabels;
  state.showTrails = next.showTrails;
  state.showAsteroids = next.showAsteroids;
  document.getElementById("toggle-orbits").checked = next.showOrbits;
  document.getElementById("toggle-labels").checked = next.showLabels;
  document.getElementById("toggle-trails").checked = next.showTrails;
  document.getElementById("toggle-asteroids").checked = next.showAsteroids;
  orbitLines.forEach((line) => {
    line.visible = next.showOrbits;
  });
  trailLines.forEach((line) => {
    line.visible = next.showTrails;
  });
  if (asteroidBelt) asteroidBelt.visible = next.showAsteroids;
});

updateSimDate();
// Initial focus from URL (camera will lerp)
focusBody(state.focusId, { syncUrl: false });
animate();
