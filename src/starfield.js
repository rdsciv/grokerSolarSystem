import * as THREE from "three";

export function createStarfield(scene) {
  const count = 8000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 800 + Math.random() * 1200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const t = Math.random();
    if (t < 0.15) color.setHSL(0.6, 0.4, 0.85);
    else if (t < 0.35) color.setHSL(0.1, 0.5, 0.9);
    else if (t < 0.45) color.setHSL(0.0, 0.6, 0.75);
    else color.setHSL(0.15, 0.05, 0.95);

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
