# Cosmos — Solar System Simulation

A beautiful, interactive Three.js simulation of the solar system with realistic relative orbital periods, adjustable time scale, starfield, and a modern glass HUD.

**Live demo:** [https://rdsciv.github.io/grokerSolarSystem/](https://rdsciv.github.io/grokerSolarSystem/)

![Cosmos solar system simulation demo](docs/demo.gif)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Features

- **All 8 planets + Sun** with Keplerian elliptical orbits
- **Earth’s Moon** and an **asteroid belt**
- **Adjustable time** from paused → centuries per second
- **Bloom lighting**, procedural planet textures, Saturn’s rings
- **Focus navigation** — click a body to track it with the camera
- **Orbit paths, labels, motion trails** toggles
- **Modern glassmorphism HUD** with FPS and simulated date

## Controls

| Input | Action |
|--------|--------|
| Drag | Orbit camera |
| Scroll | Zoom |
| Right-drag | Pan |
| Space | Pause / play |
| O | Toggle orbits |
| L | Toggle labels |

## Stack

- [Three.js](https://threejs.org/) — WebGL scene, post-processing
- [Vite](https://vitejs.dev/) — dev server & build
