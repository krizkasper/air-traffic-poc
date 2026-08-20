# AGENTS.md

## Project

Real-time air traffic map. Vite + React 19 + TypeScript, rendered with MapLibre GL JS v6, live aircraft positions from the OpenSky Network REST API.

## Structure

- `src/hooks/` — stateful map logic (creating the Map instance, adding sources/layers, data fetching tied to map lifecycle events).
- `src/components/` — UI elements rendered over the map (buttons, controls); receive the `Map` instance as a prop, don't create or own it.
- `src/lib/` — pure helper functions with no React/map lifecycle dependencies (e.g. canvas icon generation).
- `src/types.ts` — shared type definitions, notably the OpenSky API response shape.

## Commands

- `npm run dev` — start dev server (port 3030, opens browser automatically).
- `npm run build` — type-check (`tsc -b`) then production build.
- `npm run lint` — ESLint.

## Conventions

- Map logic lives in custom hooks (`useMap`, `useAircraftLayer`), never inline in components — components only consume the `Map` instance.
- `useMap` exposes the map via `useState` (not a plain ref), so dependent hooks can react to it becoming available.
- OpenSky API rows are typed as the labeled tuple `OpenSkyState` in `types.ts` — never index into raw `any[]`.
- Styling via Tailwind utility classes on elements; no per-component CSS files.

## Known gotchas

- The `/opensky` proxy in `vite.config.ts` (rewrites to `https://opensky-network.org/api`) only exists in the Vite dev server. It does not exist in a production build — deploying requires a real backend/serverless proxy or OpenSky's CORS restrictions will block the browser fetch.
- MapLibre GL JS v6 loads its worker via a URL relative to its own module (`import.meta.url`). Vite's dependency pre-bundler rewrites that URL incorrectly, so `maplibre-gl` is excluded from `optimizeDeps` in `vite.config.ts` — don't remove that exclusion without re-testing the worker loads.
- OpenSky's public (unauthenticated) endpoint is aggressively rate-limited; expect occasional 429s.
