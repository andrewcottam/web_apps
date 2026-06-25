# Linear Regression Playground

A React-based web application for analyzing vegetation change using linear regression on satellite data. This app provides an interactive map interface for drawing polygons and running change analysis.

## 📑 Table of Contents

---

- [Features](#features)
- [Installing](#installing)
- [Running Locally](#running-locally)
- [Building](#building)
- [Deploying](#deploying)
- [URL Parameters](#url-parameters)
- [API Configuration](#api-configuration)
- [Usage](#usage)
- [Parameters](#parameters)
- [Technologies](#technologies)

---

## Features

- Interactive OpenLayers map with polygon drawing
- Google Firebase authentication
- Integration with the Linear Regression cloud function API
- Configurable analysis parameters (site name, date range)
- Report link displayed on completion

## Installing

```bash
cd openlayers/linear-regression
npm install
```

## Running Locally

```bash
cd openlayers/linear-regression
npm run dev
```

The app will be available at `http://localhost:5173`

When running locally, the app will automatically connect to a local server at `http://127.0.0.1:8081/linear-regression`.

## Building

```bash
cd openlayers/linear-regression
npx vite build
```

## Deploying

Build then commit your changes and push. GitHub Pages will deploy the app to:

https://andrewcottam.github.io/web_apps/openlayers/linear-regression/dist/index.html

## URL Parameters

| Parameter | Values | Description |
|---|---|---|
| `lat`, `lng`, `zoom` | numbers | Initial map position and zoom level. Updated automatically as you pan/zoom, so the URL is always shareable. |
| `tiles` | `fgb` (default: MVT) | Sites layer rendering mode. Omit for MVT tiles (default). Set to `fgb` to load sites via FlatGeobuf instead — returns full unclipped polygon geometries, fixing large-site rendering at the cost of fetching from a separate proxy. |

**Example — open at a specific location in FGB mode:**
```
https://andrewcottam.github.io/web_apps/openlayers/linear-regression/dist/?lat=5.77&lng=118.19&zoom=12&tiles=fgb
```

### Sites layer modes

| Mode | URL | Source | Large polygons |
|---|---|---|---|
| MVT (default) | _(no param)_ | `mvt_tile_server_secure` Cloud Function | Clipped at tile boundaries |
| FGB | `?tiles=fgb` | `fgb_proxy` Cloud Function → `gs://restor-flatgeobuf/sites/sites.fgb` | Full geometry, no clipping |

Both modes filter to `site_type` of `RESTORATION` or `CONSERVATION`, and hide sites with `surface_area_km2 > 1000`.

## API Configuration

The app automatically selects the correct endpoint based on where it's running:
- **Production** (deployed on GitHub Pages): `https://europe-west6-restor-gis.cloudfunctions.net/linear-regression`
- **Local Development** (localhost): `http://127.0.0.1:8081/linear-regression`

The `fgb_proxy` endpoint follows the same pattern:
- **Production**: `https://europe-west6-restor-gis.cloudfunctions.net/fgb_proxy`
- **Local Development**: `http://127.0.0.1:8082`

## Usage

1. Log in with your Google account (must be whitelisted or @restor.eco email)
2. Draw a polygon on the map to define your area of interest
3. Configure analysis parameters:
   - **Site Name**: Name of the site being analyzed
   - **Date Range**: Start and end dates for analysis
4. Click "Analyze Change" to run the analysis
5. View results — a link to the generated report will appear when complete

## Parameters

- **geometry**: Drawn polygon coordinates
- **start_date**: Analysis start date (defaults to 7 days ago)
- **end_date**: Analysis end date (defaults to today)
- **site_name, site_id**: Site identification
- **report_org, report_owner_name, report_owner_email**: Report metadata
- **debug**: Enable debug mode

## Technologies

- React 19
- TypeScript
- OpenLayers 10
- Material-UI 7
- Firebase Authentication
- Vite build tool
