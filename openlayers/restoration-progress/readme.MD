# Restoration Progress

Draw a reference site polygon, find its most consistent pixel, and chart the AlphaEarth Foundations embedding at that point; or pick two points to compare their embeddings directly — a first step toward tracking a site's restoration progress against AlphaEarth embeddings.

## 📑 Table of Contents

- [How it works](#how-it-works)
- [Running](#running)
- [Deploying](#deploying)
- [Live site](#live-site)

---

## How it works

### Draw reference site

1. Draw a polygon on the map (**Draw reference site**).
2. The polygon is sent to [`alphaearth-embedding`'s `/min-pixel`](https://europe-west6-restor-gis.cloudfunctions.net/alphaearth-embedding/min-pixel) endpoint (see [restor-servers' cloud_functions/alphaearth-embedding](../../../restor-servers/cloud_functions/alphaearth-embedding)), which returns the location of the polygon's most consistent, natural-land-cover pixel.
3. That location is shown as a point on the map, with its consistency value and land-cover year.
4. The same point's longitude/latitude is then sent to `alphaearth-embedding`'s base endpoint (`POST /`) to fetch its 64-dim AlphaEarth Foundations embedding for 2025, which is charted as a bar per band (A00-A63).

Note: `/min-pixel`'s stability COG is hardcoded server-side to a single Sabah pilot export, so a drawn polygon only gets a useful result inside that COG's extent (~5.19-5.93N, 117.74-118.48E) — the app's default view is centered there.

### Compare points

1. Click **Compare points**, then click two points anywhere on the map (labeled A/B, colored blue/orange).
2. Both points' embeddings are fetched from `alphaearth-embedding`'s base endpoint for the same year (2025), in parallel.
3. They're charted as grouped bars per band (A00-A63) — Point A vs. Point B at each band — alongside their cosine similarity (embeddings are unit-normalized, so the dot product of the two vectors gives this directly, no separate normalization needed).

Otherwise based on [openlayers/datacube](../datacube) for its map/auth/draw scaffolding (Firebase Google sign-in, `ol-mapbox-style` satellite basemap, `ol/interaction/Draw`, URL-synced lat/lon/zoom) — see that app's readme for the details of those pieces, which are unchanged here.

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
