require(["dojo/_base/lang", "dojo/_base/array", "dojo/io-query", "dojo/request/script", "dojo/on", "node_modules/mapbox-gl/dist/mapbox-gl.js", "scripts/mapbox-gl-geocoder.min.js", "scripts/mapbox-gl-inspect.min.js"],
    function(lang, array, ioQuery, script, on, mapboxgl, MapboxGeocoder, MapboxInspect) {
        var debug = true;
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        if (debug) {
            console.debug("Using MapBoxGL version: " + mapboxgl.version);
            console.debug("Go here for the version history: https://github.com/mapbox/mapbox-gl-js/releases");
        }
        var map = new mapboxgl.Map({
            container: 'map',
            // style: "mapbox://styles/mapbox/streets-v10", //vanilla mapbox style
            // style: "mapbox://styles/blishten/cj6f4n2j026qf2rnunkauikjm", //my style with a few minor edits including the salonga tileset
            // style: "styles/localcopy.json", //straight copy of the previous mapbox studio authored style
            style: "styles/localcopyplus.json", //straight copy of the previous mapbox studio authored style plus tippecanoe data on C9 and tilemaker data on google cloud storage
            // style: "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json", //openmaptile style
            center: [-14.8975, 16.5887], //senegal
            center: [21, -2], //salonga
            zoom: 12,
        });
        //add the map controls
        map.addControl(new MapboxInspect({
            showInspectButton: debug,
            popup: new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            })
        }));
        map.addControl(new mapboxgl.FullscreenControl());
        var geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            flyTo: false, //this stops the geocoder panning to the result so we have to do it manually (below)
        });
        //zoom to the location of selected feature 
        geocoder.on("result", function(evt) {
            map.setCenter(evt.result.geometry.coordinates);
        });
        //no results found so assume it is an OSM id and zoom to id
        geocoder.on("results", function(evt) {
            if (!evt.features.length) {
                script.get("https://nominatim.openstreetmap.org/lookup?", {
                    query: {
                        osm_ids: evt.query[0].toUpperCase(),
                        format: "json",
                    },
                    jsonp: "json_callback"
                }).then(function(data) {
                    if (data && data.length != 0) {
                        map.setCenter([data[0].lon, data[0].lat]);
                    }
                });
            }
        });
        map.addControl(geocoder);
        map.on("load", function(e) {
            console.debug(e);
            //to get the layer ids
            // map.getStyle().layers;
            // addLayerWDPA();
            // addLayerTippeCanoe();
            // addLayerSentinelHub();
            // addLayerContours();
        });
        map.on("zoomend", function(e) {
            console.debug("Zoom: " + map.getZoom());
        });
        map.on("styledata", function(e) {
            // console.debug(e);
        });
        map.on("sourcedata", function(e) {
            // console.debug(e);
        });
        map.on("mousemove", function(e) {
            if (debug) {
                var features = map.queryRenderedFeatures(e.point);
                // console.debug(features);
            }
        });

        //adds a vector layer produced by tippeecanoe on the vector-tiles C9 workspace 
        function addLayerTippeCanoe() {
            map.addLayer({
                "id": "salongageojson",
                "type": "fill",
                layout: {
                    visibility: "visible",
                },
                "source": {
                    "type": 'vector',
                    "tiles": ['https://vector-tiles-blishten.c9users.io/tilesets/{z}/{x}/{y}.pbf'],
                },
                "source-layer": "salongageojson",
                "paint": {
                    "fill-color": "rgba(99,148,69, 0.2)",
                    "fill-outline-color": "rgba(87,131,61, 0.4)",
                },
            });
        }

        function addLayerWDPA() {
            map.addLayer({
                "id": "wdpa",
                "type": "fill",
                "source": {
                    type: 'vector',
                    tiles: ['https://storage.googleapis.com/geeimageserver.appspot.com/wdpa_africa/{z}/{x}/{y}.pbf'],
                },
                "source-layer": "protected_areas",
                "paint": {
                    "fill-color": "rgba(99,148,69, 0.2)",
                    "fill-outline-color": "rgba(87,131,61, 0.4)",
                },
            });
        }

        function addLayerSentinelHub() {
            //sentinel hub parameters - hard-coded for now
            var wmsParams = {
                service: "WMS",
                request: "GetMap",
                layers: "TRUE_COLOR",
                time: "2017-07-01/2017-07-31/P1D",
                atmFilter: "DOS1",
                transparent: true,
                bgcolor: "#cccccc",
                warnings: "no",
                showLogo: false,
                width: 256,
                height: 256,
                format: "image/jpeg",
                srs: "EPSG:3857",
            };
            var params = ioQuery.objectToQuery(wmsParams);
            map.addLayer({
                'id': 'wms-test-layer',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://services.sentinel-hub.com/v1/wms/363b9a1a-de1b-4009-b1d2-ba935bea739e?bbox={bbox-epsg-3857}&' + params,
                    ],
                    'tileSize': 256
                },
                'paint': {}
            }, 'landuse_overlay_national_park');
        }

        function addLayerContours() {
            map.addLayer({
                "id": "terrain-data",
                "type": "line",
                "source": {
                    type: 'vector',
                    url: 'mapbox://mapbox.mapbox-terrain-v2'
                },
                "source-layer": "contour",
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "#ff69b4",
                    "line-width": 1
                }
            });
        }
    });
