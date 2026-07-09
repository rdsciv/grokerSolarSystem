# Cosmos — Solar System Simulation

[![Live demo](https://img.shields.io/badge/demo-live-7eb8ff?style=flat-square)](https://rdsciv.github.io/grokerSolarSystem/)
[![License: MIT](https://img.shields.io/badge/license-MIT-5eead4?style=flat-square)](LICENSE)
[![Three.js](https://img.shields.io/badge/three.js-r172-black?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/rdsciv/grokerSolarSystem?style=flat-square)](https://github.com/rdsciv/grokerSolarSystem/stargazers)

A beautiful, interactive Three.js simulation of the solar system with realistic relative orbital periods, adjustable time scale, starfield, and a modern glass HUD.

**Live demo:** [https://rdsciv.github.io/grokerSolarSystem/](https://rdsciv.github.io/grokerSolarSystem/)

![Cosmos solar system simulation demo](docs/demo.gif)

## Run locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # serve dist/
```

## Features

- **All 8 planets + Sun** with Keplerian elliptical orbits
- **Earth’s Moon** and an **asteroid belt**
- **Adjustable time** from paused → centuries per second
- **Bloom lighting**, procedural planet textures, Saturn’s rings
- **Focus navigation** — click a body to track it with the camera
- **Orbit paths, labels, motion trails** toggles
- **Shareable URLs** — focus, speed, and display flags in the query string
- **Modern glassmorphism HUD** with FPS and simulated date

## Shareable links

Views sync to the URL so you can bookmark or share a configuration:

| Param | Example | Meaning |
|--------|---------|---------|
| `focus` | `saturn` | Body under camera focus |
| `speed` | `365` | Earth days per real second |
| `orbits` | `0` | Hide orbit paths |
| `labels` | `0` | Hide labels |
| `trails` | `1` | Show motion trails |
| `asteroids` | `0` | Hide asteroid belt |

Example:  
[?focus=jupiter&speed=30&trails=1](https://rdsciv.github.io/grokerSolarSystem/?focus=jupiter&speed=30&trails=1)

Use the **Share** button in the HUD (or press `S`) to copy the current link.

## Controls

| Input | Action |
|--------|--------|
| Drag | Orbit camera |
| Scroll | Zoom |
| Right-drag | Pan |
| Space | Pause / play |
| O | Toggle orbits |
| L | Toggle labels |
| S | Share / copy link |

## Scale & accuracy

This is a **visualization**, not an ephemeris:

- **Orbital periods, eccentricity, and axial tilt** use standard planetary values so relative motion feels right (Mercury races; Neptune crawls).
- **Distances and radii are compressed** so the whole system fits on screen. Outer planets use stronger distance compression than the inner system.
- **Planet textures are procedural** (not NASA maps).
- Starting orbital phases are deterministic per body id for stable reloads.

Approximate orbital elements are drawn from commonly cited NASA / JPL planetary fact sheets (semi-major axis, period, eccentricity, rotation, tilt).

## Project layout

```
src/
  main.js         # bootstrap, animation loop, UI wiring
  data.js         # body catalog & distance scaling
  time.js         # speed slider helpers
  textures.js     # procedural textures
  starfield.js    # stars / milky-way band
  solarSystem.js  # meshes, orbits, moon, asteroids
  urlState.js     # shareable query params
  style.css       # HUD
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and features use the issue templates under `.github/ISSUE_TEMPLATE/`.

## Stack

- [Three.js](https://threejs.org/) — WebGL scene, post-processing
- [Vite](https://vitejs.dev/) — dev server & build
- GitHub Actions — CI build + Pages deploy

## License

[MIT](LICENSE) © 2026 Ryan Childress

## Star History

<p align="center">
 <a href="https://www.star-history.com/#rdsciv/grokerSolarSystem&Date">
  <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=rdsciv/grokerSolarSystem&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=rdsciv/grokerSolarSystem&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=rdsciv/grokerSolarSystem&type=Date" />
  </picture>
 </a>
</p>
