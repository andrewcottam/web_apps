require(["dojo/io-query", "dojo/request/script", "dojo/on", "node_modules/mapbox-gl/dist/mapbox-gl.js", "scripts/mapbox-gl-geocoder.min.js"],
    function(ioQuery, script, on, mapboxgl, MapboxGeocoder) {
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9',
            // style: simple,
            center: [-14.8975, 16.5887],
            zoom: 12,
        });
        map.addControl(new mapboxgl.FullscreenControl());
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
        var geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            flyTo: false,
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
                }, function(err) {
                    console.error(err);
                });
            }
        });

        map.addControl(geocoder);
        map.on('load', function() {
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
            map.on('mousemove', 'wdpa', function(e) {
                map.getCanvas().style.cursor = 'pointer';
                popup.setLngLat(e.lngLat)
                    .setHTML(e.features[0].properties.NAME)
                    .addTo(map);
            });
            map.on('mouseleave', 'wdpa', function() {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
            //sentinel hub parameters
            var layers = "TRUE_COLOR";
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
            }, 'aeroway-taxiway');
        });
    });
