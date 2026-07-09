/** Map slider 0–100 → Earth days advanced per real second (log-ish curve). */
export function sliderToSpeed(v) {
  if (v <= 0) return 0;
  const t = v / 100;
  return Math.pow(10, t * 4.56) * 0.01; // ~0.01 … ~36500
}

export function speedToLabel(dps) {
  if (dps <= 0) return "Paused";
  if (dps < 0.05) return `${(dps * 24).toFixed(1)} h / sec`;
  if (dps < 1.5) return `${dps.toFixed(2)} day / sec`;
  if (dps < 30) return `${dps.toFixed(1)} days / sec`;
  const years = dps / 365.25;
  if (years < 1.5) return `${years.toFixed(2)} yr / sec`;
  if (years < 50) return `${years.toFixed(1)} yr / sec`;
  return `${Math.round(years)} yr / sec`;
}

export function speedToSlider(dps) {
  if (dps <= 0) return 0;
  return Math.min(100, (Math.log10(dps / 0.01) / 4.56) * 100);
}
