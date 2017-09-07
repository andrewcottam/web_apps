require(["dojo/_base/array", "dojo/dom-style", "dojo/dom-geometry", "dojox/gfx", "dojo/_base/lang", "dojo/_base/array", "dojo/io-query", "dojo/request/script", "dojo/on", "node_modules/mapbox-gl/dist/mapbox-gl.js", "scripts/mapbox-gl-geocoder.min.js", "scripts/mapbox-gl-inspect.min.js"],
    function(array, domStyle, domGeom, gfx, lang, array, ioQuery, script, on, mapboxgl, MapboxGeocoder, MapboxInspect) {
        var debug = true;
        var calloutSurface, popup, canvas, calloutRadius = 7,
            calloutLength = 50,
            calloutWidth = 3,
            osmVisibility = 'visible';
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        if (debug) {
            console.debug("Using MapBoxGL version: " + mapboxgl.version);
            console.debug("Go here for the version history: https://github.com/mapbox/mapbox-gl-js/releases");
        }
        var map = new mapboxgl.Map({
            container: 'map',
            // style: "mapbox://styles/mapbox/streets-v10?optimize=true", //vanilla mapbox style
            style: "mapbox://styles/blishten/cj6f4n2j026qf2rnunkauikjm", //my Basic style
            // style: "styles/localcopy.json", //local copy of the previous mapbox studio authored style
            // style: "styles/localcopyplus.json", //local copy of the previous mapbox studio authored style plus tippecanoe data on google cloud storage
            // style: "styles/mapzen_basic.json", //mapzen style
            // style: "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json", //openmaptile style
            center: [-14.8975, 16.5887], //senegal
            // center: [21, -2], //salonga
            zoom: 12,
        });
        //add the map controls
        // map.addControl(new MapboxInspect({
        //     showInspectButton: debug,
        //     popup: new mapboxgl.Popup({
        //         closeButton: false,
        //         closeOnClick: false
        //     })
        // }));
        map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
        map.addControl(new mapboxgl.ScaleControl());
        map.addControl(new mapboxgl.NavigationControl(), 'top-left');
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
                        map.setZoom(15);
                    }
                });
            }
        });
        map.addControl(geocoder);
        map.on("load", function(e) {
            addLayerContours();
            addLayerSentinelHub();
            addLayerWDPA();
            addLayerWater();
            canvas = map.getCanvas();
            createSurface();
            createPopup();
        });
        map.on("error", function(e) {
            // console.error("Something bad happened");
        });
        map.on("click", function(e) {
            map.setStyle('mapbox://styles/blishten/cj6q75jcd39gq2rqm1d7yv5rc'); //marine style
        });
        map.on("zoomend", function(e) {
            console.debug("Zoom: " + map.getZoom());
        });
        map.on("resize", function(e) {
            createSurface();
        });
        map.on("mousemove", function(e) {
            // console.debug("map mousemove");
            var features = map.queryRenderedFeatures(e.point);
            if (features.length) {
                showCallout(features, e);
            }
            else {
                hideCallout(e);
            }
            // console.debug(canvas.style.cursor);
        });

        map.on("pitchstart", hideCallout);
        map.on("rotatestart", hideCallout);

        var toggleableLayerIds = ['imagery', 'WDPA', 'openstreetmap', 'contours', 'jrc_water'];

        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i];
            var link = document.createElement('a');
            link.href = '#';
            link.className = 'active';
            link.textContent = id;
            link.onclick = function(e) {
                var id = this.textContent;
                e.preventDefault();
                e.stopPropagation();
                var visibility = (id == "openstreetmap") ? osmVisibility : map.getLayoutProperty(id, 'visibility');
                if (visibility === 'visible') {
                    hideLayer(id);
                    this.className = '';
                }
                else {
                    this.className = 'active';
                    showLayer(id);
                }
            };
            var layers = document.getElementById('layers');
            layers.appendChild(link);
        }

        function hideLayer(id) {
            if (id == 'openstreetmap') {
                for (var layer in map.style._layers) {
                    if (map.style._layers[layer].source == "composite") {
                        map.setLayoutProperty(map.style._layers[layer].id, 'visibility', 'none');
                    }
                }
                osmVisibility = 'none';
            }
            else {
                map.setLayoutProperty(id, 'visibility', 'none');
            }
        }

        function showLayer(id) {
            if (id == 'openstreetmap') {
                for (var layer in map.style._layers) {
                    if (map.style._layers[layer].source == "composite") {
                        map.setLayoutProperty(map.style._layers[layer].id, 'visibility', 'visible');
                    }
                }
                osmVisibility = 'visible';
            }
            else {
                map.setLayoutProperty(id, 'visibility', 'visible');
            }
        }



        function addLayerWDPA() {
            map.addLayer({
                "id": "WDPA",
                "type": "fill",
                "source": {
                    "attribution": "IUCN and UNEP-WCMC (2017), The World Database on Protected Areas (WDPA) August 2017, Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>",
                    "type": "vector",
                    "tilejson": "2.2.0",
                    "maxzoom": 12,
                    "tiles": ["https://storage.googleapis.com/geeimageserver.appspot.com/vectorTiles/wdpa/tilesets/{z}/{x}/{y}.pbf"]
                },
                "source-layer": "wdpa",
                "layout": {
                    "visibility": "visible"
                },
                "paint": {
                    "fill-color": {
                        "type": "categorical",
                        "property": "MARINE",
                        "stops": [
                            ["0", "rgba(99,148,69, 0.2)"],
                            ["1", "rgba(63,127,191, 0.2)"],
                            ["2", "rgba(63,127,191, 0.2)"]
                        ]
                    },
                    "fill-outline-color": {
                        "type": "categorical",
                        "property": "MARINE",
                        "stops": [
                            ["0", "rgba(99,148,69, 0.2)"],
                            ["1", "rgba(63,127,191, 0.2)"],
                            ["2", "rgba(63,127,191, 0.2)"]
                        ]
                    }
                }
            });
        }

        function addLayerContours() {
            map.addLayer({
                "id": "contours",
                "type": "line",
                "source": {
                    "type": "vector",
                    "url": "mapbox://mapbox.mapbox-terrain-v2"
                },
                "source-layer": "contour",
                "layout": {
                    "line-join": "round",
                    "line-cap": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "#ff69b4",
                    "line-width": 1
                }
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
                'id': 'imagery',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://services.sentinel-hub.com/v1/wms/363b9a1a-de1b-4009-b1d2-ba935bea739e?bbox={bbox-epsg-3857}&' + params,
                    ],
                    'tileSize': 256
                },
                'layout': {
                    'visibility': 'visible'
                },
                'paint': {}
            }, 'Landuse -National park');
        }

        function addLayerWater() {
            map.addLayer({
                'id': 'jrc_water',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://storage.googleapis.com/global-surface-water/maptiles/transitions/{z}/{x}/{y}.png',
                    ],
                    'tileSize': 256
                },
                'layout': {
                    'visibility': 'visible'
                },
                'paint': {}
            }, 'Landuse -National park');
        }

        function createSurface() {
            var position = domGeom.position("map");
            if (calloutSurface) {
                calloutSurface.setDimensions(position.w, position.h);
            }
            else {
                var container = map.getCanvasContainer();
                calloutSurface = gfx.createSurface(container, position.w, position.h);
            }
        }

        function showCallout(features, e) {
            var html = getPopupText(features);
            if (calloutSurface && html) {
                map.dragPan.disable();
                calloutSurface.clear();
                calloutSurface.createCircle({
                    cx: e.point.x,
                    cy: e.point.y,
                    r: calloutRadius
                }).setStroke({
                    color: "white",
                    width: calloutWidth
                });
                calloutSurface.createLine({
                    x1: e.point.x + (calloutRadius / 2) + calloutWidth,
                    y1: e.point.y,
                    x2: e.point.x + calloutLength,
                    y2: e.point.y
                }).setStroke({
                    color: "white",
                    width: calloutWidth
                });
                popup.setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
                var position = domGeom.position(popup._content);
                popup.options.offset = [calloutLength, position.h / 2];
                canvas.style.cursor = "none";
            }
        }

        function hideCallout(e) {
            if (calloutSurface) {
                map.dragPan.enable();
                calloutSurface.clear();
                popup.remove();
                canvas.style.cursor = "";
            }
        }

        function createPopup() {
            popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: [50, 0]
            });
        }

        function getPopupText(features) {
            var feature = features[0];
            var color;
            if (feature.layer['source-layer'] == 'wdpa') {
                color = feature.properties.MARINE=="0" ? "rgba(99,148,69, 0.2)" : "rgba(63,127,191, 0.2)";
            }
            else {
                color = feature.layer.paint.hasOwnProperty("fill-color") ? feature.layer.paint["fill-color"] : feature.layer.paint["line-color"];
            }
            var header = "<div class='layer' style='background-color:" + color + "'>" + feature.layer.id + "</div>";
            var properties = [];
            var propertyNames = [];
            var text = "";
            var omitProps = ["sort_rank", "kind_detail", "id:right", "id:left", "source", "area", "min_zoom", "id", "osm_relation", "tier", "boundary", "ISO3"]; //exclude the following properties from appearing - these are Mapzen specific
            for (var prop in feature.properties) { //iterate through the properties of the OSM feature and populate the properties that are valid and that we want to show
                if (omitProps.indexOf(prop) == -1) { //omit certain system properties
                    if (Object.values(properties).indexOf(feature.properties[prop]) == -1) { //check that we havent already got the value
                        properties[prop] = feature.properties[prop];
                        propertyNames.push(prop);
                    }
                }
            }
            //order the property names
            moveElementToStart(propertyNames, "NAME");
            moveElementToStart(propertyNames, "name");
            moveElementToStart(propertyNames, "kind");
            if (propertyNames.length > 0) {
                text = "<table class='popupTable'>";
                for (let prop of propertyNames) { //iterate through the properties that we want to show and build the html for the popup
                    var value = properties[prop]; //get the value
                    if (typeof(value) == "string") { //check the value is a string
                        value = value.replace("_", " "); //replace any underscores
                    }
                    switch (prop) {
                        case "NAME":
                        case "name":
                            text += "<tr><td colspan='2' class='name'>" + value + "</td></tr>";
                            break;
                        default:
                            if (typeof(value) == "string") {
                                value = toSentenceCase(value); //Sentence case
                            }
                            text += "<tr><td class='propName'>" + toSentenceCase(prop) + "</td><td class='propValue'>" + value + "</td></tr>"; //write the html text with the new value in
                            break;
                    }
                }
                text += "</table>";
            }
            return header + text;
        }

        function toSentenceCase(text) {
            return text.substr(0, 1).toUpperCase() + text.substr(1);
        }

        function moveElementToStart(array, propertyName) {
            var pos = array.indexOf(propertyName);
            if (pos) {
                array.unshift(array[pos]);
                array.splice(pos + 1, 1);
            }
            return array;
        }
    });
