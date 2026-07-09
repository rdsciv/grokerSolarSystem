import * as THREE from "three";
import { BODIES, visualDistance } from "./data.js";
import {
  makePlanetTexture,
  makeSunTexture,
  makeGlowSprite,
} from "./textures.js";

export const TRAIL_LENGTH = 180;

/** Deterministic 0–2π seed from body id so reloads stay stable. */
function phaseFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000 * Math.PI * 2;
}

export function placeOnOrbit(group, meanAnomaly) {
  const a = group.userData.semiMajor;
  const e = group.userData.eccentricity || 0;
  let E = meanAnomaly;
  for (let i = 0; i < 6; i++) {
    E = meanAnomaly + e * Math.sin(E);
  }
  const x = a * (Math.cos(E) - e);
  const z = a * Math.sqrt(1 - e * e) * Math.sin(E);
  group.position.set(x, 0, z);
}

function createOrbitLine(distance, color, eccentricity = 0) {
  const a = distance;
  const e = eccentricity;
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e;
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
  return new THREE.Line(geo, mat);
}

function createRings(planetRadius) {
  const inner = planetRadius * 1.35;
  const outer = planetRadius * 2.35;
  const geo = new THREE.RingGeometry(inner, outer, 128);
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

function createBody(data, ctx) {
  const { systemRoot, bodyMeshes, orbitLines, trailLines, labelsEl, labelNodes } =
    ctx;
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

    const glowGeo = new THREE.SphereGeometry(data.radius * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    const coronaGeo = new THREE.SphereGeometry(data.radius * 1.55, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff7711,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));

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

    mesh.rotation.z = THREE.MathUtils.degToRad(data.axialTilt || 0);

    if (data.hasRings) {
      const rings = createRings(data.radius);
      rings.rotation.x =
        -Math.PI / 2 + THREE.MathUtils.degToRad(data.axialTilt || 0) * 0.3;
      group.add(rings);
    }
  }

  group.add(mesh);
  group.userData.mesh = mesh;
  group.userData.meanAnomaly0 = phaseFromId(data.id);
  group.userData.trail = [];

  if (data.distanceAU > 0) {
    const d = visualDistance(data.distanceAU);
    const e = data.eccentricity || 0;
    group.userData.semiMajor = d;
    group.userData.eccentricity = e;
    placeOnOrbit(group, group.userData.meanAnomaly0);

    const orbit = createOrbitLine(d, data.color, e);
    systemRoot.add(orbit);
    orbitLines.set(data.id, orbit);

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

  const label = document.createElement("div");
  label.className = "planet-label";
  label.textContent = data.name;
  labelsEl.appendChild(label);
  labelNodes.set(data.id, label);

  return group;
}

function createAsteroidBelt(systemRoot) {
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
  const asteroidBelt = new THREE.Points(geo, mat);
  asteroidBelt.userData.periodDays = 1500;
  systemRoot.add(asteroidBelt);
  return asteroidBelt;
}

function createMoon(earthGroup) {
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
    meanAnomaly0: phaseFromId("moon"),
    orbitRadius: 2.2,
  };
  earthGroup.add(moonGroup);
  return { moonGroup, moonMesh };
}

/**
 * Build the full solar system into `scene`.
 * @returns {{ bodyMeshes, orbitLines, trailLines, labelNodes, asteroidBelt, moonGroup, moonMesh, systemRoot }}
 */
export function buildSolarSystem(scene) {
  const bodyMeshes = new Map();
  const orbitLines = new Map();
  const trailLines = new Map();
  const labelsEl = document.getElementById("labels");
  const labelNodes = new Map();
  const systemRoot = new THREE.Group();
  scene.add(systemRoot);

  const ctx = {
    systemRoot,
    bodyMeshes,
    orbitLines,
    trailLines,
    labelsEl,
    labelNodes,
  };

  BODIES.forEach((data) => createBody(data, ctx));
  const asteroidBelt = createAsteroidBelt(systemRoot);
  const earthGroup = bodyMeshes.get("earth");
  const { moonGroup, moonMesh } = createMoon(earthGroup);

  return {
    bodyMeshes,
    orbitLines,
    trailLines,
    labelNodes,
    asteroidBelt,
    moonGroup,
    moonMesh,
    systemRoot,
  };
}
