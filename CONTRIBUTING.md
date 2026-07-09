# Contributing to Cosmos

Thanks for helping improve this solar-system simulation.

## Quick start

```bash
git clone https://github.com/rdsciv/grokerSolarSystem.git
cd grokerSolarSystem
npm install
npm run dev
```

Requirements: **Node.js 20+** (see `.nvmrc`) and Git.
```bash
npm run build   # production build (same as CI / GitHub Pages)
npm run preview # preview the production build
```

## Project layout

```
src/
  main.js         # app bootstrap, animation loop, wiring
  data.js         # planet data, distance scaling, formatters
  time.js         # simulation speed helpers
  textures.js     # procedural sun/planet textures
  starfield.js    # background stars / milky-way band
  solarSystem.js  # meshes, orbits, trails, moon, asteroids
  urlState.js     # shareable ?focus=&speed= URL params
  style.css       # HUD + layout
index.html        # markup / HUD structure
.github/workflows # Pages deploy + CI
```

## Guidelines

- Prefer small, focused PRs.
- Keep the HUD readable: glass panels, clear hierarchy, no clutter.
- Orbital **periods and eccentricity** should stay physically relative; visual distance/radius scaling is intentionally compressed for viewing.
- Avoid adding heavy dependencies unless they clearly improve the demo.
- Run `npm run build` before opening a PR.

## Shareable URLs

The app reads and writes query params so views can be linked:

| Param | Example | Meaning |
|--------|---------|---------|
| `focus` | `saturn` | Camera focus body id |
| `speed` | `365` | Earth days advanced per real second |
| `orbits` | `1` / `0` | Show orbit paths |
| `labels` | `1` / `0` | Show body labels |
| `trails` | `1` / `0` | Motion trails |
| `asteroids` | `1` / `0` | Asteroid belt |

Example: `?focus=jupiter&speed=30&trails=1`

## Ideas for contributions

- Mobile HUD / touch polish
- NASA public-domain surface textures
- Performance quality presets (bloom / star count)
- Accessibility (reduced motion, keyboard focus rings)
- Educational overlays (scale notes, constellation toggle)

## Issues & PRs

- Use the issue templates for bugs and features.
- Reference related issues in your PR description.
- One logical change per PR when possible.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
