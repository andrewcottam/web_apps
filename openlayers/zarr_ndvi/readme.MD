# NDVI Timeseries Explorer

Draw a polygon anywhere over `restor-datacube/sentinel2_ndvi/site-123_timeseries.zarr`
and see its NDVI aggregated into a per-year bar chart. Reads the zarr store (public
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

# Running
Rename vite.config.js to _vite.config.js
```
cd openlayers/zarr_ndvi
npm install
npx vite
```

# Deploying
Rename _vite.config.js to vite.config.js
```
cd openlayers/zarr_ndvi
npm run build
```
Commit and push to GitHub.

# Live site
Is available at:
https://andrewcottam.github.io/web_apps/openlayers/zarr_ndvi/dist/index.html
