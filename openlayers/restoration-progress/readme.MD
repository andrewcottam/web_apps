# Restoration Progress

Draw a reference site polygon, find its most stable pixel, and chart the AlphaEarth Foundations embedding at that point — a first step toward tracking a site's restoration progress against AlphaEarth embeddings.

## 📑 Table of Contents

- [How it works](#how-it-works)
- [Running](#running)
- [Deploying](#deploying)
- [Live site](#live-site)

---

## How it works

1. Draw a polygon on the map (**Draw reference site**).
2. The polygon is sent to [`alphaearth-embedding`'s `/min-pixel`](https://europe-west6-restor-gis.cloudfunctions.net/alphaearth-embedding/min-pixel) endpoint (see [restor-servers' cloud_functions/alphaearth-embedding](../../../restor-servers/cloud_functions/alphaearth-embedding)), which returns the location of the polygon's most stable, natural-land-cover pixel.
3. That location is shown as a point on the map, with its stability value and land-cover year.
4. The same point's longitude/latitude is then sent to `alphaearth-embedding`'s base endpoint (`POST /`) to fetch its 64-dim AlphaEarth Foundations embedding for 2025, which is charted as a bar per band (A00-A63).

Otherwise based on [openlayers/datacube](../datacube) for its map/auth/draw scaffolding (Firebase Google sign-in, `ol-mapbox-style` satellite basemap, `ol/interaction/Draw`, URL-synced lat/lon/zoom) — see that app's readme for the details of those pieces, which are unchanged here.

Note: `/min-pixel`'s stability COG is hardcoded server-side to a single Sabah pilot export, so a drawn polygon only gets a useful result inside that COG's extent (~5.19-5.93N, 117.74-118.48E) — the app's default view is centered there.

## Running

```bash
cd openlayers/restoration-progress
npm install
npx vite
```

## Deploying

```bash
cd openlayers/restoration-progress
npm run build
```
Commit and push to GitHub.

## Live site

Will be available at:
https://andrewcottam.github.io/web_apps/openlayers/restoration-progress/dist/index.html
