# OPERA DIST-ALERT Web Application

A React-based web application for analyzing vegetation disturbance using NASA's OPERA DIST-ALERT satellite data. This app provides an interactive map interface for drawing polygons and detecting deforestation, fire damage, and land-use changes.

## Features

- Interactive OpenLayers map with polygon drawing
- Google Firebase authentication
- Integration with OPERA DIST-ALERT cloud function API
- Configurable disturbance analysis parameters
- Automatic report generation and email alerts
- Detailed disturbance statistics and visualization

## Installing

```bash
cd openlayers/dist-alert
npm install
```

## Running Locally

### Frontend Only
```bash
cd openlayers/dist-alert
npm run dev
```

The app will be available at `http://localhost:5173`

When running locally, the app will automatically connect to a local dist-alert server at `http://127.0.0.1:8080`.

### With Local Backend

To run the full stack locally:

1. Start the dist-alert cloud function locally (in the restor-servers repo):
   ```bash
   cd cloud_functions/dist-alert
   python main.py
   ```
   This will start the server at `http://127.0.0.1:8080`

2. Start the frontend:
   ```bash
   cd openlayers/dist-alert
   npm run dev
   ```

The frontend will automatically detect it's running on localhost and connect to the local backend.

## Building

```bash
cd openlayers/dist-alert
npx vite build
```

## Deploying

Build then commit your changes and push. GitHub Pages will deploy the app to:

https://andrewcottam.github.io/web_apps/openlayers/dist-alert/dist/index.html

## API Configuration

The app automatically selects the correct endpoint based on where it's running:
- **Production** (deployed on GitHub Pages): `https://europe-west6-restor-gis.cloudfunctions.net/dist-alert`
- **Local Development** (localhost): `http://127.0.0.1:8080`

## Usage

1. Log in with your Google account (must be whitelisted or @restor.eco email)
2. Draw a polygon on the map to define your area of interest
3. Configure analysis parameters:
   - **Site Name**: Name of the site being monitored
   - **Organization**: Organization conducting the analysis
   - **Report Owner**: Name and email for report delivery
   - **Date Range**: Start and end dates for analysis
   - **Confidence Level**: Minimum confidence threshold (initial/provisional/confirmed)
   - **Disturbance Percentage**: Minimum percentage to trigger alert
4. Click "Analyze Disturbance" to run the analysis
5. View results including:
   - Disturbance detection status
   - Affected area statistics
   - Detailed HTML report (if disturbance detected)
   - Email notification confirmation

## Parameters

- **geometry**: Drawn polygon (converted to WKT format)
- **start_date**: Analysis start date (defaults to 7 days ago)
- **end_date**: Analysis end date (defaults to today)
- **min_confidence**: Confidence level filter (default: "confirmed")
- **min_disturbance_percentage**: Alert threshold (default: 10.0%)
- **site_name, site_id**: Site identification
- **report_org, report_owner_name, report_owner_email**: Report metadata
- **report_subscriber_emails**: Comma-separated list of email recipients
- **debug**: Enable debug mode

## Technologies

- React 19
- TypeScript
- OpenLayers 10
- Material-UI 7
- Firebase Authentication
- Vite build tool