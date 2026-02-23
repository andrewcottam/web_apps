The Site verification playground uses two external services which should be started before running it locally:
- The MVT Tile service for the WDPA and Restor site boundaries on the map - these will come from https://europe-west6-restor-gis.cloudfunctions.net/mvt_tile_server_secure
- The Site Verification service - this needs to be started locally in a new terminal:
```
conda activate restor-servers
cd /Users/andrewcottam/Documents/GitHub/restor-servers/cloud_functions/site_verify
functions-framework --target=verify_site --port=8080 --debug
```
Then start the Site verification playground locally - make sure it is running on port 5173:
```
cd openlayers/verify
npm run dev
```

# Building
If you are bringing in changes from Claude, it builds already so when you merge you already have the latest built files. Otherwise you can do:

```
cd openlayers/verify
npx vite build
```

# Deploying
Build then commit your changes and push. GitHub will build the pages and then the site-verify app will be available at:

https://andrewcottam.github.io/web_apps/openlayers/verify/dist/index.html