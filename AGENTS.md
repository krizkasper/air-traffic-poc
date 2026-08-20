# AGENTS.md

## Project

Real-time air traffic map. Vite + React 19 + TypeScript, rendered with MapLibre GL JS v6, live aircraft positions from the OpenSky Network REST API.

## Structure

- `src/hooks/` — stateful map logic (creating the Map instance, adding sources/layers, data fetching tied to map lifecycle events).
- `src/components/` — UI elements rendered over the map (buttons, controls); receive the `Map` instance as a prop, don't create or own it.
- `src/lib/` — static SVG icon assets (aircraft, helicopter, dark/light mode toggle, globe), imported with Vite's `?url` suffix. The aircraft/helicopter icons are rasterized at runtime in `useAircraftLayer.ts`; the toggle icons are used directly as `<img>` sources. Not a home for helper code.
- `src/types.ts` — shared type definitions, notably the OpenSky API response shape.
- `vite-plugins/` — Node-side Vite plugins (dev server only, not part of the app bundle), e.g. the OpenSky OAuth2 proxy.

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

- The `/opensky` proxy (`vite-plugins/openskyProxyPlugin.ts`, wired up in `vite.config.ts`) only exists in the Vite dev server. It does not exist in a production build — deploying requires a real backend/serverless proxy or OpenSky's CORS restrictions will block the browser fetch.
- MapLibre GL JS v6 loads its worker via a URL relative to its own module (`import.meta.url`). Vite's dependency pre-bundler rewrites that URL incorrectly, so `maplibre-gl` is excluded from `optimizeDeps` in `vite.config.ts` — don't remove that exclusion without re-testing the worker loads.
- The proxy authenticates against OpenSky via OAuth2 client credentials (`OPENSKY_CLIENT_ID`/`OPENSKY_CLIENT_SECRET` in `.env`, gitignored) and caches the token until expiry. Without those env vars it silently falls back to anonymous access, which is aggressively rate-limited (400 credits/day, 10s resolution) — expect frequent 429s in that case.
- `map.loadImage()` only decodes PNG/JPEG — SVGs throw `InvalidStateError: The source image could not be decoded`. Icons in `src/lib/*.svg` are instead rasterized manually (`<img>.decode()` → canvas) in `useAircraftLayer.ts`'s `loadIcon`.
- `useAircraftLayer` attaches its source/layer/handlers on `style.load`, not `load`, so they survive `DarkModeToggle`'s `map.setStyle()` calls (which fire a fresh `style.load` and wipe custom sources/layers/images added on the previous style).
