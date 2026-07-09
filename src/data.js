/**
 * Solar system body data.
 * Distances scaled for visibility (not true AU scale).
 * Periods in Earth days — realistic relative orbital/rotation speeds.
 */

export const AU_SCALE = 28; // scene units per AU (compressed outer system slightly)

export const BODIES = [
  {
    id: "sun",
    name: "Sun",
    type: "Star",
    color: 0xffcc55,
    emissive: 0xffaa22,
    radius: 4.2,
    realRadiusKm: "696,340 km",
    distanceAU: 0,
    periodDays: 0,
    rotationDays: 25.4,
    axialTilt: 7.25,
    moons: "—",
    blurb:
      "The Sun is a G-type main-sequence star at the heart of our solar system, holding the planets in gravitational embrace.",
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "Terrestrial",
    color: 0xa8a29e,
    radius: 0.38,
    realRadiusKm: "2,440 km",
    distanceAU: 0.39,
    periodDays: 87.97,
    rotationDays: 58.6,
    axialTilt: 0.03,
    eccentricity: 0.206,
    moons: "0",
    blurb:
      "The smallest planet and closest to the Sun — a cratered world of extreme temperature swings.",
  },
  {
    id: "venus",
    name: "Venus",
    type: "Terrestrial",
    color: 0xe8c47a,
    radius: 0.72,
    realRadiusKm: "6,052 km",
    distanceAU: 0.72,
    periodDays: 224.7,
    rotationDays: -243,
    axialTilt: 177.4,
    eccentricity: 0.007,
    moons: "0",
    blurb:
      "Earth's twin in size, veiled in a runaway greenhouse atmosphere of sulfuric acid clouds.",
  },
  {
    id: "earth",
    name: "Earth",
    type: "Terrestrial",
    color: 0x4a90d9,
    radius: 0.76,
    realRadiusKm: "6,371 km",
    distanceAU: 1.0,
    periodDays: 365.25,
    rotationDays: 1,
    axialTilt: 23.4,
    eccentricity: 0.017,
    moons: "1",
    hasAtmosphere: true,
    atmosphereColor: 0x6eb5ff,
    blurb:
      "Our home — the only known world with liquid water oceans and life under a blue sky.",
  },
  {
    id: "mars",
    name: "Mars",
    type: "Terrestrial",
    color: 0xc45c3e,
    radius: 0.48,
    realRadiusKm: "3,390 km",
    distanceAU: 1.52,
    periodDays: 686.98,
    rotationDays: 1.03,
    axialTilt: 25.2,
    eccentricity: 0.094,
    moons: "2",
    blurb:
      "The Red Planet — rust-colored deserts, polar ice, and the tallest volcano in the solar system.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gas giant",
    color: 0xd4a574,
    radius: 2.4,
    realRadiusKm: "69,911 km",
    distanceAU: 5.2,
    periodDays: 4332.59,
    rotationDays: 0.41,
    axialTilt: 3.1,
    eccentricity: 0.049,
    moons: "95+",
    hasBands: true,
    blurb:
      "The king of planets — a stormy gas giant whose Great Red Spot has raged for centuries.",
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gas giant",
    color: 0xe8d5a3,
    radius: 2.0,
    realRadiusKm: "58,232 km",
    distanceAU: 9.58,
    periodDays: 10759.22,
    rotationDays: 0.45,
    axialTilt: 26.7,
    eccentricity: 0.057,
    moons: "146+",
    hasRings: true,
    blurb:
      "Jewel of the outer system — famous for its vast, icy ring system and pale gold clouds.",
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Ice giant",
    color: 0x7ec8e3,
    radius: 1.15,
    realRadiusKm: "25,362 km",
    distanceAU: 19.2,
    periodDays: 30688.5,
    rotationDays: -0.72,
    axialTilt: 97.8,
    eccentricity: 0.046,
    moons: "28",
    blurb:
      "An ice giant tipped on its side — methane in the atmosphere gives it a serene cyan hue.",
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Ice giant",
    color: 0x4169e1,
    radius: 1.1,
    realRadiusKm: "24,622 km",
    distanceAU: 30.05,
    periodDays: 60182,
    rotationDays: 0.67,
    axialTilt: 28.3,
    eccentricity: 0.01,
    moons: "16",
    blurb:
      "The farthest planet — deep blue, whipped by the fastest winds in the solar system.",
  },
];

/** Visual distance scaling: compress outer planets so the system fits the view */
export function visualDistance(au) {
  if (au <= 0) return 0;
  // Soft log-ish compression for outer system while keeping relative order
  if (au <= 2) return au * AU_SCALE;
  if (au <= 6) return 2 * AU_SCALE + (au - 2) * AU_SCALE * 0.55;
  return 2 * AU_SCALE + 4 * AU_SCALE * 0.55 + (au - 6) * AU_SCALE * 0.28;
}

export function formatPeriod(days) {
  if (!days) return "—";
  if (Math.abs(days) < 2) return `${days.toFixed(2)} days`;
  if (days < 400) return `${days.toFixed(1)} days`;
  const years = days / 365.25;
  if (years < 10) return `${years.toFixed(2)} years`;
  if (years < 100) return `${years.toFixed(1)} years`;
  return `${Math.round(years)} years`;
}

export function formatRotation(days) {
  if (days === undefined || days === null) return "—";
  const abs = Math.abs(days);
  const dir = days < 0 ? " (retrograde)" : "";
  if (abs < 2) return `${abs.toFixed(2)} days${dir}`;
  return `${abs.toFixed(1)} days${dir}`;
}
