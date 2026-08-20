# Air Traffic POC

Live map of air traffic over Europe. Fetches real-time aircraft positions from the OpenSky Network and renders them on a MapLibre GL JS map.

## Setup

```
npm install
npm run dev
```

Dev server runs on `localhost:3030` and opens automatically.

## Tech stack

- Vite
- React 19
- TypeScript
- MapLibre GL JS v6
- Tailwind CSS
- OpenSky Network API

## What this demonstrates

- Aircraft rendered as a MapLibre `symbol` layer (WebGL) instead of one DOM marker per plane — scales to thousands of points without DOM overhead.
- Real-time data updates via `source.setData()` on an existing GeoJSON source, instead of re-adding the layer on every fetch.
- Data-driven icon rotation (`icon-rotate` bound to each feature's `heading` property) so plane icons point in their direction of travel.
- CORS handling for a third-party API with no browser-facing CORS support, via a Vite dev-server proxy.

## Known limitations / next steps

- No interpolation between fetches — aircraft jump to their new position on each refresh instead of animating smoothly.
- No clustering — at high aircraft density, symbols will start overlapping.
- The OpenSky proxy only exists in the Vite dev server; a production deployment needs a real backend/serverless proxy in front of the OpenSky API.
- No polling loop yet — data is fetched once on load, not refreshed on an interval.
