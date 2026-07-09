/**
 * Shareable view state via URL query params.
 * Example: ?focus=saturn&speed=365&trails=1
 */

const BOOL_KEYS = ["orbits", "labels", "trails", "asteroids"];

function parseBool(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (value === "1" || value === "true" || value === "on") return true;
  if (value === "0" || value === "false" || value === "off") return false;
  return fallback;
}

export function readUrlState(defaults = {}) {
  const params = new URLSearchParams(window.location.search);
  const focus = params.get("focus") || defaults.focusId || "sun";
  const speedRaw = params.get("speed");
  let speed = defaults.daysPerSecond ?? 365;
  if (speedRaw !== null && speedRaw !== "") {
    const n = Number(speedRaw);
    if (Number.isFinite(n) && n >= 0) speed = n;
  }

  return {
    focusId: focus.toLowerCase(),
    daysPerSecond: speed,
    showOrbits: parseBool(params.get("orbits"), defaults.showOrbits ?? true),
    showLabels: parseBool(params.get("labels"), defaults.showLabels ?? true),
    showTrails: parseBool(params.get("trails"), defaults.showTrails ?? false),
    showAsteroids: parseBool(params.get("asteroids"), defaults.showAsteroids ?? true),
  };
}

export function writeUrlState(state, { replace = true } = {}) {
  const params = new URLSearchParams();
  if (state.focusId && state.focusId !== "sun") {
    params.set("focus", state.focusId);
  }
  const speed = state.daysPerSecond ?? 0;
  if (speed !== 365) {
    // Keep integers clean; allow decimals for slow speeds
    const rounded =
      speed === 0 || Number.isInteger(speed)
        ? String(speed)
        : String(Number(speed.toPrecision(4)));
    params.set("speed", rounded);
  }
  if (!state.showOrbits) params.set("orbits", "0");
  if (!state.showLabels) params.set("labels", "0");
  if (state.showTrails) params.set("trails", "1");
  if (!state.showAsteroids) params.set("asteroids", "0");

  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  if (replace) {
    history.replaceState(null, "", url);
  } else {
    history.pushState(null, "", url);
  }
  return url;
}

export function shareableUrl(state) {
  writeUrlState(state, { replace: true });
  return window.location.href;
}

export { BOOL_KEYS };
