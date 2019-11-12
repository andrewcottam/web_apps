require(["dojo/request/xhr", "dojo/dom-attr", "dojo/html", "dojo/dom", "dojo/dom-construct", "dojo/query", "dojo/dom-style", "dojo/dom-geometry", "dojox/gfx", "dojo/_base/lang", "dojo/_base/array", "dojo/io-query", "dojo/request/script", "dojo/on", "https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.js"],
    function(xhr, domAttr, html, dom, domConstruct, query, domStyle, domGeom, gfx, lang, array, ioQuery, script, on, mapboxgl) {
        var calloutSurface, popup, calloutRadius = 7,
            calloutLength = 50,
            calloutWidth = 3,
            canvas;
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        var btn = dom.byId("btn");
        on(btn, "click", function(e) {
            var filter = ['in', 'DESIG', "Ramsar Site, Wetland of International Importance"];
            map.setFilter("WDPA", filter);
        });
        var map = new mapboxgl.Map({
            container: 'map',
            style: "mapbox://styles/blishten/ck1hsullb06lw1cmyzz7wrycl", 
            center: [0, 0], 
            zoom: 2
        });
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        //add the map events
        map.on("load", function(e) {
            addLayerWDPA();
            createSurface();
            createPopup();
            map.dragPan.enable();
            canvas = map.getCanvas();
        });

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

        map.on("mousemove", function(e) {
            // console.debug("map mousemove");
            var features = map.queryRenderedFeatures(e.point);
            if ((features.length) && (features[0].layer.id != "Water")) {
                showCallout(features, e);
            }
            else {
                hideCallout();
            }
            // console.debug(canvas.style.cursor);
        });

        function addLayerWDPA() { 
            //add wdpa layer from tippecanoe files
            map.addLayer({
                "id": "WDPA",
                "type": "fill",
                "source": {
                    "attribution": "IUCN and UNEP-WCMC (2019), The World Database on Protected Areas (WDPA) November 2019, Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>",
                    "type": "vector",
                    "tilejson": "2.2.0",
                    "maxzoom": 12,
                    "tiles": ["https://storage.googleapis.com/geeimageserver.appspot.com/vectorTiles/wdpa_nov_2019_polygons/tilesets/{z}/{x}/{y}.pbf"]
                },
                "source-layer": "wdpa_nov_2019_polygons",
                "layout": {
                    "visibility": "visible"
                },
                "paint": { "fill-color": "rgba(99,148,69,0.2)", "fill-outline-color": "rgba(99,148,69,0.3)"}
            });
            //add layer from geoserver 
            // map.addLayer({
            //     "id": "WDPA",
            //     "type": "fill",
            //     "source": {
            //         "attribution": "IUCN and UNEP-WCMC (2019), The World Database on Protected Areas (WDPA) November 2019, Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>",
            //         "type": "vector",
            //         "tilejson": "2.2.0",
            //         "maxzoom": 12,
            //         "tiles": ["https://geospatial.jrc.ec.europa.eu/geoserver/gwc/service/wmts?layer=marxan:wdpa_nov_2019_polygons&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"]
            //     },
            //     "source-layer": "wdpa_nov_2019_polygons",
            //     "layout": {
            //         "visibility": "visible"
            //     },
            //     "paint": { "fill-color": "rgba(99,148,69,0.2)", "fill-outline-color": "rgba(99,148,69,0.3)"}
            // });
            
            // map.addLayer({
            //     "id": "WDPA",
            //     "type": "fill",
            //     "source": {
            //         "attribution": "IUCN and UNEP-WCMC (2019), The World Database on Protected Areas (WDPA) November 2019, Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>",
            //         "type": "vector",
            //         "tilejson": "2.2.0",
            //         "maxzoom": 12,
            //         "tiles": ["https://storage.googleapis.com/geeimageserver.appspot.com/vectorTiles/wdpa_nov_2019_polygons/tilesets/{z}/{x}/{y}.pbf"]
            //     },
            //     "source-layer": "wdpa_nov_2019_polygons",
            //     "layout": {
            //         "visibility": "visible"
            //     },
            //     "paint": {
            //         "fill-color": {
            //             "type": "categorical",
            //             "property": "MARINE",
            //             "stops": [
            //                 ["0", "rgba(99,148,69, 0.2)"],
            //                 ["1", "rgba(63,127,191, 0.2)"],
            //                 ["2", "rgba(63,127,191, 0.2)"]
            //             ]
            //         },
            //         "fill-outline-color": {
            //             "type": "categorical",
            //             "property": "MARINE",
            //             "stops": [
            //                 ["0", "rgba(99,148,69, 0.2)"],
            //                 ["1", "rgba(63,127,191, 0.2)"],
            //                 ["2", "rgba(63,127,191, 0.2)"]
            //             ]
            //         }
            //     }
            // });
        }

  //gets unique features from an array of features based on the key property
  function removeDuplicateFeatures(arr, key){
    let uniqueValues =[], uniqueFeatures = [];
		arr.forEach(feature=>{
			if (uniqueValues.indexOf(feature.properties[key]) === -1){
				uniqueFeatures.push(feature);
				uniqueValues.push(feature.properties[key]);
			}
		});
    return uniqueFeatures;
  }
        function showCallout(features, e) {
            let allFeatures = map.queryRenderedFeatures(map.getBounds());
            console.log("All features: " + allFeatures.length);
            let wdpaids = removeDuplicateFeatures(allFeatures, "WDPAID");
            console.log("Unique wdpaids: " + wdpaids.length);
            var html = getPopupText(features);
            if (calloutSurface && html) {
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
                popup.class = 'hover';
                canvas.style.cursor = "none";
            }
        }

        function hideCallout(e) {
            if (calloutSurface) {
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
                color = feature.properties.MARINE == "0" ? "rgba(99,148,69, 0.2)" : "rgba(63,127,191, 0.2)";
            }
            else {
                color = feature.layer.paint.hasOwnProperty("fill-color") ? feature.layer.paint["fill-color"] : feature.layer.paint["line-color"];
            }
            var header = "<div class='layer' style='background-color:" + color + "'><i class='fa fa-map-marker' aria-hidden='true'></i>" + feature.layer.id + "</div>";
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
