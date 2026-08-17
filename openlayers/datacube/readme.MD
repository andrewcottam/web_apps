# NDVI Timeseries Explorer

Draw a polygon anywhere over `restor-datacube/sentinel2_ndvi/site-123_timeseries.zarr`
and see its NDVI aggregated into a per-year seasonal chart. Reads the zarr store (public
GCS, zarr v2, consolidated metadata) directly from the browser with
[zarrita](https://github.com/manzt/zarrita.js) — no backend involved.

## Requires: CORS on the bucket

The `restor-datacube` bucket currently has no CORS configuration, so a browser
`fetch()` against it will be blocked. Enable it once with:

```
gsutil cors set cors.json gs://restor-datacube
```

where `cors.json` is:

```json
[
  {
    "origin": ["https://andrewcottam.github.io", "http://localhost:5173"],
    "method": ["GET"],
    "responseHeader": ["Content-Type", "Range", "Content-Range"],
    "maxAgeSeconds": 3600
  }
]
```

Add any other origins (e.g. a different local dev port) you need to `origin`.

## How the client renders the zarr store

There's no backend and no pre-aggregation step — the browser reads the raw zarr
store directly and does all the work itself, once, up front.

**1. One full fetch, cached for the page's lifetime.** The first time you draw a
polygon, `loadNdviData()` ([main.js](main.js)) fetches the *entire* `ndvi`/`x`/`y`/`time`
arrays for the site — not just your polygon's area — from the public GCS bucket via
[zarrita](https://github.com/manzt/zarrita.js):
- One small request for the store's consolidated metadata (`.zmetadata`) describes
  every array's shape/dtype/compression up front.
- The array chunks are then fetched as HTTP range requests and decompressed
  **in the browser**, using the native `DecompressionStream('deflate')` API — no
  JS zlib library needed.
- The result is memoized in a module-scoped `ndviDataPromise`, so every later
  polygon draw or raster click reuses the same in-memory arrays — no re-fetch,
  no re-decompress, for the rest of the session.

**2. Everything after that is pure in-memory computation, no network involved.**
Once the full time series is sitting in memory as typed arrays:
- **Polygon aggregation** (`computeObservations`): a point-in-polygon test over
  the pixel-center grid, then a mean over whichever pixels fall inside, for every
  timestep — a JS loop over the already-loaded arrays.
- **The chart**: hand-built inline SVG (`renderNdviChart`/`buildSeriesMarkup`),
  no charting library. Grouping by year is just `date.getUTCFullYear()` on the
  decoded `time` coordinate — a plain JS grouping, unrelated to how the zarr
  file happens to be chunked on disk. Cumulative-per-year mode
  (`plotValuesForYearPoints`) is a running sum over the same in-memory values.
- **Clicking a date to show its raster on the map** (`renderNdviRaster`): slices
  the *already-loaded* `ndvi` array at that timestep's index, paints it onto a
  `<canvas>`, and hands that canvas's `toDataURL()` PNG to an OpenLayers
  `ImageStatic` layer. No network request per click.

The only genuinely per-interaction network traffic is the satellite basemap
tiles (MapTiler) on pan/zoom — ordinary tile-layer behavior, unrelated to the
NDVI data path.

This means the server-side zarr file only needs to be a plain flat time series —
no year-based chunking or pre-aggregation is required, since the client already
computes whatever yearly/cumulative views it needs from the raw series. The one
caveat: this "fetch it all up front" approach only stays fast because a site's
array is small enough to pull entirely into memory. A much larger time series
(more years × higher resolution × more frequent revisits) would eventually need
either windowed zarr reads (fetch only the chunks covering the drawn polygon's
bounding box) or a coarser server-side summary array.

# Running
Rename vite.config.js to _vite.config.js
```
cd openlayers/datacube
npm install
npx vite
```

# Deploying
Rename _vite.config.js to vite.config.js
```
cd openlayers/datacube
npm run build
```
Commit and push to GitHub.

# Live site
Is available at:
https://andrewcottam.github.io/web_apps/openlayers/datacube/dist/index.html
