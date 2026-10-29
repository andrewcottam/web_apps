# DIST-ALERT Interactive Map

A lightweight OpenLayers viewer for the disturbance-alert COGs linked from DIST-ALERT reports. Renders the VEG-DIST-STATUS overlay directly from its public Cloud Optimized GeoTIFF URL on top of a switchable basemap, with a toggle for the disturbance layer and click-to-get-coordinates.

## 📑 Table of Contents

---

- [Features](#features)
- [Running Locally](#running-locally)
- [Building](#building)
- [Deploying](#deploying)
- [URL Parameters](#url-parameters)
- [Rendering notes](#rendering-notes)
- [Technologies](#technologies)

---

## Features

- Client-side COG rendering (`ol/source/GeoTIFF` + WebGL) — no tile server needed
- Basemap switcher: OSM / Satellite (default) / Grey
- Disturbance overlay on/off toggle
- Optional site boundary outline (`geom` param)
- Pan/zoom constrained to the site's bounding box; can't zoom out far past it
- Click anywhere to read off the lat/lon (click again on the readout to copy)

## Running Locally

```bash
cd openlayers/dist-alert-map
npm install
npx vite
```

## Building

```bash
npx vite build
```

## Deploying

Build then commit `dist/` and push. GitHub Pages serves the app at:

https://andrewcottam.github.io/web_apps/openlayers/dist-alert-map/dist/

**To put this behind `dist-alert-map.restor.eco`** (not yet configured): add a CNAME
record for that subdomain pointing at `andrewcottam.github.io` in Cloud DNS, and set
it as this repo's custom domain in GitHub Pages settings. Note a GitHub Pages custom
domain applies to the whole `web_apps` repo, not just this one app — every other app
in this repo becomes reachable under the same domain too (at its own subpath), which
is harmless but worth knowing.

## URL Parameters

| Parameter | Values | Description |
|---|---|---|
| `cog` | URL(s), comma-separated | VEG-DIST-STATUS COG URL(s) for the disturbance overlay. Multiple COGs (one per MGRS tile) are mosaicked automatically. |
| `bbox` | `minLon,minLat,maxLon,maxLat` | Site bounding box in EPSG:4326. Constrains the initial view and the pan/zoom range (padded 15%). Falls back to the COG's own extent if omitted. |
| `geom` | GeoJSON geometry, URI-encoded | Site boundary (Polygon/MultiPolygon in EPSG:4326), drawn as an outline over the imagery. Omitted when the request geometry was itself just a bbox. |
| `site` | string | Site name, shown as the page title and panel heading. |
| `color` | hex, no `#` | Overlay color for disturbed pixels. Default `ff3b30`. |
| `alpha` | 0-255 | Overlay opacity. Default `160`. |

**Example:**
```
https://dist-alert-map.restor.eco/?site=My+Site&bbox=118.15,5.74,118.22,5.80&cog=https://storage.googleapis.com/.../VEG-DIST-STATUS.tif
```

## Rendering notes

VEG-DIST-STATUS is a categorical, single-band raster: `0` = no disturbance, `1`–`8` =
disturbance classes of increasing confidence/severity, `255` = nodata. This viewer
renders every disturbed pixel (any value other than `0` or `255`) as a single
semi-transparent color, matching the single-color cumulative-disturbance overlay
already used for the report's overview image — it does not currently distinguish
between the individual confidence/severity classes.

The COG's native CRS (typically a UTM zone) is registered with `proj4` via
`fromEPSGCode` before the map is created, so the WebGL tile renderer can reproject it
into the map's EPSG:3857 view — this must happen before first render or tile requests
fail silently.

Each source is opened with `nodata: NaN`. Without it, `ol/source/GeoTIFF` auto-detects
the TIFF's declared nodata value, masks those pixels, and auto-stretches the remaining
data's own min/max for display — which corrupts the raw 0-8/255 values the overlay
style's exact-value comparisons depend on, and renders the whole COG footprint as solid
opaque white instead of a transparent background with colored disturbance pixels.

Both the GeoTIFF source and the WebGL layer are created with `interpolate: false`. The
layer's own setting controls only the final display sampling; the *source's* setting is
what matters here — it forces nearest-neighbour resampling during the reprojection from
the COG's native UTM grid into the map's EPSG:3857 view. Without it on the source,
that reprojection step blends adjacent class codes together at the raster's edge,
tracing a false "disturbed" outline around the whole site boundary even though no such
value exists anywhere in the source data.

## Technologies

- OpenLayers 10
- proj4
- Vite
