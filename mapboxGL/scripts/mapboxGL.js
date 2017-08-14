require(["node_modules/mapbox-gl/dist/mapbox-gl.js"],
    function(mapboxgl) {
        var simple = {
            "version": 8,
            "sources": {
                "wdpa": {
                    "type": "vector",
                    "tiles": ["https://storage.googleapis.com/geeimageserver.appspot.com/wdpa_africa/{z}/{x}/{y}.pbf"], //my africa wdpa vector tiles
                }
            },
            "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
            "layers": [{
                "id": "background",
                "type": "background",
                "paint": {
                    "background-color": "#ffffff"
                }
            }, {
                "id": "pas",
                "type": "fill",
                "source": "wdpa",
                "source-layer": "protected_areas",
                "paint": {
                    "fill-color": "rgba(99,148,69, 0.4)",
                    "fill-outline-color": "rgba(87,131,61, 0.4)"
                }
            }]
        };
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9',
            // style: simple,
            center: [-14.8975, 16.5887],
            zoom: 12,
        });
        map.on('load', function() {
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
            map.addLayer({
                "id": "wdpa",
                "type": "fill",
                "source": {
                    type: 'vector',
                    tiles: ['https://storage.googleapis.com/geeimageserver.appspot.com/wdpa_africa/{z}/{x}/{y}.pbf'],
                },
                "source-layer": "protected_areas",
                "paint": {
                    "fill-color": "rgba(99,148,69, 0.4)",
                    "fill-outline-color": "rgba(87,131,61, 0.4)"
                }
            });
        });
    });
