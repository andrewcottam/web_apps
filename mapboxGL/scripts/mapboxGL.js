require({
        async: true,
        paths: {
            widgetsPackage: "/../../widgets",
        }
    }, ["dojo/request/xhr", "widgetsPackage/PhotoBoxFlickr", "widgetsPackage/WebServiceAPIs/FlickrAPI", "dojo/dom-attr", "dojo/html", "dojo/dom", "dojo/dom-construct", "dojo/query", "dojo/dom-style", "dojo/dom-geometry", "dojox/gfx", "dojo/_base/lang", "dojo/_base/array", "dojo/io-query", "dojo/request/script", "dojo/on", "node_modules/mapbox-gl/dist/mapbox-gl.js", "scripts/mapbox-gl-geocoder.min.js", "scripts/mapbox-gl-inspect.min.js"],
    function(xhr, PhotoBoxFlickr, FlickrAPI, domAttr, html, dom, domConstruct, query, domStyle, domGeom, gfx, lang, array, ioQuery, script, on, mapboxgl, MapboxGeocoder, MapboxInspect) {
        var debug = true,
            countryPopups = [],
            provincePopups = [],
            addingplacemark = false;
        var pictCountries = ["American Samoa", "Cook Islands", "Federated States of Micronesia", "Fiji", "French Polynesia", "Guam", "Kiribati", "Marshall Islands", "Nauru", "New Caledonia", "Niue", "Northern Mariana Islands", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tokelau", "Tonga", "Tuvalu", "Vanuatu", "Wallis and Futuna"];
        var calloutSurface, popup, canvas, calloutRadius = 7,
            calloutLength = 50,
            calloutWidth = 3,
            osmVisibility = 'visible';
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var today = dd + '/' + mm + '/' + yyyy;
        // html.set("forestcover_citation", "ForestCover_lossyear. World Resources Institute. Accessed through Global Forest Watch on " + today + ". <a href='www.globalforestwatch.org'>www.globalforestwatch.org</a>");
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        if (debug) {
            console.debug("Using MapBoxGL version: " + mapboxgl.version);
            console.debug("Go here for the version history: https://github.com/mapbox/mapbox-gl-js/releases");
        }
        var map = new mapboxgl.Map({
            container: 'map',
            // style: "mapbox://styles/mapbox/streets-v10?optimize=true", //vanilla mapbox style
            // style: "mapbox://styles/blishten/cj6f4n2j026qf2rnunkauikjm", //my Basic style
            style: "styles/cbd11.json", //local copy of the previous mapbox studio authored style
            // style: "styles/localcopyplus.json", //local copy of the previous mapbox studio authored style plus tippecanoe data on google cloud storage
            // style: "styles/mapzen_basic.json", //mapzen style
            // style: "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json", //openmaptile style
            // center: [-14.8975, 16.5887], //senegal
            // center: [21, -2], //salonga
            center: [161.76, -8.14], //pacific
            zoom: 4,
            // zoom: 12,
            hash: true,
        });
        //add the map controls
        // map.addControl(new MapboxInspect({
        //     showInspectButton: debug,
        //     popup: new mapboxgl.Popup({
        //         closeButton: false,
        //         closeOnClick: false
        //     })
        // }));
        map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
        map.addControl(new mapboxgl.ScaleControl());
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        var geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            flyTo: false, //this stops the geocoder panning to the result so we have to do it manually (below)
        });
        //zoom to the location of selected feature 
        geocoder.on("result", function(evt) {
            if (evt.result.hasOwnProperty("bbox")) {
                map.fitBounds(evt.result.bbox); //zoom to the bounding box if it has one
            }
            else {
                map.setCenter(evt.result.geometry.coordinates); //otherwise zoom to the centre
            }
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

        //add the map events
        map.on("load", function(e) {
            filterLabelsForPictCountries();
            addLayerContours();
            addDigitalGlobeImagey(); //no license for this at the moment
            // addLayerSentinelHub();
            // addLayerWDPA();
            addLayerWater();
            addGlobalForestWatch();
            canvas = map.getCanvas();
            createSurface();
            createPopup();
            addCountriesTable();
            addCountryTable();
        });
        map.on("error", function(e) {
            // console.error("Something bad happened");
        });
        map.on("click", function(e) {
            if (addingplacemark) {
                addPlacemark(e);
            }
            else {
                map.setStyle('mapbox://styles/blishten/cj6q75jcd39gq2rqm1d7yv5rc'); //marine style
            }
        });
        map.on("zoomend", function(e) {
            console.debug("Zoom: " + map.getZoom());
            //lots of attempts at getting photo data from various sources but none working
            // script.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json?", {
            //     query: {
            //         key: 'AIzaSyDTxDpwaFu7qVsS-EeptGHgYMeeTEfzWzg',
            //         location: '-5.631,150.933',
            //         radius: 50000
            //     },
            //     jsonp: "callback"
            // }).then(function(data) {
            //     console.log(data);
            // });
            // script.get("https://mapsights.com/get_photos?minlat=-4.23497294268466&minlng=152.0629692077637&maxlat=-4.162041447792609&maxlng=152.2826957702637", {
            //     jsonp: "callback"
            // }).then(function(data) {
            //     console.log(data);
            // });

            // xhr("https://mapsights.com/get_photos?minlat=-4.23497294268466&minlng=152.0629692077637&maxlat=-4.162041447792609&maxlng=152.2826957702637", {
            //     headers: { "X-Requested-With": null },
            //     handleAs: "json"
            // }).then(function(data) {
            //     console.log(data);
            // }, function(err) {}, function(evt) {});
        });
        map.on("moveend", function(e) {
            addCountryPopups();
            addProvincesPopups();
        });
        // map.on("pitchend", function(e) {
        //     addCountryPopups();
        // });
        map.on("resize", function(e) {
            createSurface();
        });
        map.on("mousemove", function(e) {
            // console.debug("map mousemove");
            var features = map.queryRenderedFeatures(e.point);
            if ((features.length) && (features[0].layer.id != "Water")) {
                showCallout(features, e);
            }
            else {
                hideCallout(e);
            }
            // console.debug(canvas.style.cursor);
        });
        map.on("pitchstart", hideCallout);
        map.on("rotatestart", hideCallout);
        map.on("zoomstart", hideCallout);

        //add the events for the breadcrumb trail
        on(dom.byId("summaryText"), "click", function() {
            gotoSummaryPage();
        });
        on(dom.byId("countriesText"), "click", function() {
            gotoCountriesPage();
        });
        on(dom.byId("countryText"), "click", function(evt) {
            gotoCountryPage(evt);
        });

        //add the events for the arrow clicks
        on(dom.byId("gotoCountriesPageArrow"), "click", function() {
            gotoCountriesPage();
        });
        on(dom.byId("countriesPage"), "click", function(evt) {
            gotoCountryPage(evt);
        });
        on(dom.byId("countryPage"), "click", function(evt) {
            gotoProvincePage(evt);
        });
        on(dom.byId("validate"), "click", function(evt) {
            // map.setCenter([151.4739, -5.1169]);
            // map.setZoom(11.44);
            map.zoomTo(11.44);
            map.setLayoutProperty("Imagery", 'visibility', 'visible'); //turn on the imagery
            query("nav#layers a[title=Imagery]")[0].className = 'active';
            removeProvincesPopups();
            // var bbox = map.getBounds();
            // var flickrapi = new FlickrAPI({
            //     map: map,
            //     providers: ["flickr"],
            //     tags: ["biopama"],
            //     text: "outdoor",
            //     accuracy: 4,
            // }, 4);
            // flickrapi.getImagesForBBox(bbox._sw.lng, bbox._sw.lat, bbox._ne.lng, bbox._ne.lat);
            // on(flickrapi, "imagesLoaded", function(evt) {
            //     array.forEach(this.photos, function(photo) {
            //         var photoBox = new PhotoBoxFlickr({
            //             photo: photo,
            //             photoSize: "thumbnail"
            //         });
            //         photoBox.startup();
            //         var photoPopup = new mapboxgl.Popup({
            //             closeButton: true,
            //             closeOnClick: false,
            //             offset: [0, 0]
            //         });
            //         photoPopup.setLngLat([151.4739, -5.1169])
            //             .setHTML(photoBox.domNode.outerHTML)
            //             .addTo(map);
            //     });
            // });
            var photoPopup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                offset: [0, 0]
            });
            photoPopup.setLngLat([151.3399, -5.1107])
                .setHTML("<img src='images/png_deforestation.png' title='Deforestation in PNG'>")
                .addTo(map);

        });

        on(dom.byId('addplacemark'), 'click', function(evy) {
            addingplacemark = true;
        })

        function addPlacemark(e) {
            var popup = new mapboxgl.Popup({ closeOnClick: false })
                .setLngLat(e.lngLat)
                .setHTML('<form style="margin:5px">  <input type="radio" name="val1" checked> Groundtruth required<br>  <input type="radio" name="val1"> Within logging concession<br>  <input type="radio" name="val1" > Illegal activity<br>  <br/><input type="button" value="go"></form>')
                .addTo(map);
        }

        function gotoSummaryPage() {
            //show the first page and right arrow
            domStyle.set("summaryPage", "display", "block");
            //hide the other pages
            domStyle.set("countriesText", "display", "none");
            domStyle.set("countriesPage", "display", "none");
            domStyle.set("countryText", "display", "none");
            domStyle.set("countryPage", "display", "none");
            domStyle.set("actionPage", "display", "none");
        }

        function gotoCountriesPage() {
            addCountryPopups();
            //hide the other pages
            domStyle.set("summaryPage", "display", "none");
            domStyle.set("countryText", "display", "none");
            domStyle.set("countryPage", "display", "none");
            domStyle.set("actionPage", "display", "none");
            //show the countries page and text
            domStyle.set("countriesText", "display", "inline");
            domStyle.set("countriesPage", "display", "block");
        }

        function gotoCountryPage(evt) {
            //zoom to the country
            var country = evt.target.title.substr(8);
            geocoder.options.types = "country,region";
            geocoder.query(country);
            geocoder.options.types = undefined; //reset the filter
            //hide the other pages
            domStyle.set("countriesPage", "display", "none");
            domStyle.set("actionPage", "display", "none");
            //show the country page and text
            html.set("countryText", " | " + country);
            domAttr.set("countryText", "title", "Back to " + country);
            domStyle.set("countryText", "display", "inline");
            domStyle.set("countryPage", "display", "block");
        }

        function gotoProvincePage(evt) {
            var province = evt.target.title.substr(8);
            geocoder.options.types = "country,region";
            geocoder.query(province + " Papua New Guinea");
            geocoder.options.types = undefined; //reset the filter
            //hide the other pages
            domStyle.set("countriesPage", "display", "none");
            //show the country page and text
            html.set("province", province);
            domStyle.set("countryPage", "display", "none");
            domStyle.set("actionPage", "display", "block");
        }

        //layer controls
        var toggleableLayerIds = ['Imagery', 'WDPA', 'OpenStreetMap', 'GlobalForestWatch', 'Contours', 'JRC Water'];
        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i];
            var link = document.createElement('a');
            link.href = '#';
            link.className = 'active';
            link.textContent = id;
            link.title = id;
            link.onclick = function(e) {
                var id = this.textContent;
                e.preventDefault();
                e.stopPropagation();
                var visibility;
                if (id == "OpenStreetMap") {
                    visibility = osmVisibility;
                    if (osmVisibility != 'visible') {
                        addCountryPopups();
                        addProvincesPopups();
                    }
                    else {
                        removeCountryPopups();
                        removeProvincesPopups();
                    }
                }
                else {
                    visibility = map.getLayoutProperty(id, 'visibility');
                }
                if (visibility === 'visible') {
                    hideLayer(this);
                }
                else {
                    showLayer(this);
                }
            };
            var layers = document.getElementById('layers');
            layers.appendChild(link);
        }
        query("nav#layers a[title=Imagery]")[0].className = ''; //set the class on the link to not visible
        query("nav#layers a[title=JRC Water]")[0].className = ''; //set the class on the link to not visible
        query("nav#layers a[title=Contours]")[0].className = ''; //set the class on the link to not visible


        function hideLayer(linkButton) {
            linkButton.className = '';
            var id = linkButton.textContent;
            if (id == 'OpenStreetMap') {
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

        function showLayer(linkButton) {
            linkButton.className = "active";
            var id = linkButton.textContent;
            if (id == 'OpenStreetMap') {
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

        function addGlobalForestWatch() {
            map.addLayer({
                'id': 'GlobalForestWatch',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    // "attribution":"Potapov P. et al. 2008. Mapping the World's Intact Forest Landscapes by Remote Sensing. Ecology and Society, 13 (2)",
                    'tiles': [
                        // 'https://globalforestwatch-624153201.us-west-1.elb.amazonaws.com/arcgis/services/ForestCover_lossyear/ImageServer/WMSServer?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=0'
                        // 'https://50.18.182.188:6080/arcgis/services/ForestCover_lossyear/ImageServer/WMSServer?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=0'
                        'https://gis-treecover.wri.org/arcgis/services/ForestCover_lossyear/ImageServer/WMSServer?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=0'
                    ],
                    'tileSize': 256
                },
                "layout": {
                    "visibility": "visible"
                },
                'maxzoom': 14,
                'minzoom': 7,
                'paint': {}
            }, 'Intact Forest 2013');
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
                "id": "Contours",
                "type": "line",
                "source": {
                    "type": "vector",
                    "url": "mapbox://mapbox.mapbox-terrain-v2"
                },
                "source-layer": "contour",
                "layout": {
                    "line-join": "round",
                    "line-cap": "round",
                    "visibility": "none"
                },
                "paint": {
                    "line-color": "#ff69b4",
                    "line-width": 1
                }
            });
        }

        function addDigitalGlobeImagey() {
            map.addLayer({
                'id': 'Imagery',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://a.tiles.mapbox.com/v4/digitalglobe.n6nhclo2/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImIzMWY3NDA3NjlhYThlNjdiMTA2MGMxNzU0ZDE2YzY4In0.8jtWjgDsAwqFouTWzSnkJw',
                    ],
                    'tileSize': 256
                },
                'maxzoom': 19,
                'layout': {
                    'visibility': 'none'
                },
                'paint': {}
            }, 'Landuse -National park');
        }

        function addLayerSentinelHub() {
            //sentinel hub parameters - hard-coded for now
            var wmsParams = {
                service: "WMS",
                request: "GetMap",
                layers: "TRUE_COLOR",
                time: "2015-01-01/2017-09-31/P1D",
                atmFilter: "DOS1",
                transparent: true,
                bgcolor: "#cccccc",
                warnings: "no",
                showLogo: false,
                width: 256,
                MAXCC: 20,
                GAIN: 2,
                height: 256,
                format: "image/jpeg",
                srs: "EPSG:3857",
            };
            var params = ioQuery.objectToQuery(wmsParams);
            map.addLayer({
                'id': 'Imagery',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://services.sentinel-hub.com/v1/wms/363b9a1a-de1b-4009-b1d2-ba935bea739e?bbox={bbox-epsg-3857}&' + params,
                    ],
                    'tileSize': 256
                },
                'layout': {
                    'visibility': 'none'
                },
                'paint': {}
            }, 'Landuse -National park');
        }

        function addLayerWater() {
            map.addLayer({
                'id': 'JRC Water',
                'type': 'raster',
                'source': {
                    'type': 'raster',
                    'tiles': [
                        'https://storage.googleapis.com/global-surface-water/maptiles/transitions/{z}/{x}/{y}.png',
                    ],
                    'tileSize': 256
                },
                'maxzoom': 14,
                'layout': {
                    'visibility': 'none'
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
                popup.class = 'hover';
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

        function getCountries(renderedOnly) {
            var countries;
            if (renderedOnly) {
                // countries = map.queryRenderedFeatures({ layers: ['Country label'] });
                var filter = ['in', 'name_en', "American Samoa", "Cook Islands", "Federated States of Micronesia", "Fiji", "French Polynesia", "Guam", "Kiribati", "Marshall Islands", "Nauru", "New Caledonia", "Niue", "Northern Mariana Islands", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tokelau", "Tonga", "Tuvalu", "Vanuatu", "Wallis and Futuna"];
                countries = map.queryRenderedFeatures({ layers: ['Country label'], filter: filter });
            }
            else {
                countries = map.querySourceFeatures("composite", { sourceLayer: 'country_label' });
            }
            return countries;
        }

        function addCountryPopups() {
            removeCountryPopups();
            if ((map.getZoom() < 3) || (map.getZoom() >= 6)) {
                return;
            }
            var countryFeatures = getCountries(true);
            var countriesDone = [];
            array.forEach(countryFeatures, function(feature) {
                if (countriesDone.indexOf(feature.properties.name_en) == -1) { //because we are getting the features from ALL rendered tiles there will be duplicate countries so only take the first one
                    countriesDone.push(feature.properties.name_en);
                    var num = getArea(feature.properties.name_en);
                    var color = ['Papua New Guinea', 'Solomon Islands', 'Fiji', 'New Caledonia'].indexOf(feature.properties.name_en) > -1 ? "#D0583B" : "#3974B1";
                    // var latLng = getOffset(feature);
                    var yOffset = (feature.properties.name_en.length > 17) ? 50 : 40;
                    var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: [-51, yOffset] })
                        .setLngLat(feature.geometry.coordinates)
                        .setHTML("<div class='indicatorPopup'><span class='fa fa-circle-o-notch' aria-hidden='true' style='font-size:19px;padding-right:10px;color:" + color + "'></span><span>" + num + " Km<span style='font-size:9px;vertical-align: super; padding: 2px;'>2</span></span></div>")
                        .addTo(map);
                    countryPopups.push(popup);
                }
            });
        }

        function getArea(name) {
            var num;
            switch (name) {
                case "Papua New Guinea":
                    num = 187645;
                    break;
                case "Solomon Islands":
                    num = 3857;
                    break;
                case "Fiji":
                    num = 3249;
                    break;
                case "New Caledonia":
                    num = 8331;
                    break;
                default:
                    num = 0;
                    break;
            }
            return num;
        }

        function removeCountryPopups() {
            array.forEach(countryPopups, function(countryPopup) {
                countryPopup.remove();
            });
            countryPopups = [];
        }

        function getOffset(feature) {
            //Open Sans Regular is the default font and is scaled from 14px to 22px with zoom levels from 3 to 8 - no longer used
            var zoomLevel = map.getZoom();
            var fontSize;
            if (zoomLevel <= 3) {
                fontSize = 14;
            }
            if (zoomLevel > 3) {
                fontSize = 14 + (((zoomLevel - 3) / 5) * 8);
            }
            if (zoomLevel > 8) {
                fontSize = 22;
            }
            var canvas = document.getElementById("hiddenCanvas");
            var ctx = canvas.getContext('2d');
            ctx.font = fontSize + "px Open Sans Regular";
            var textWidth = ctx.measureText(feature.properties.name_en).width;
            var centre = map.project(feature.geometry.coordinates);
            var minX = centre.x - (textWidth / 2);
            var latLng = map.unproject([minX, centre.y]);
            return latLng;
        }

        function filterLabelsForPictCountries() {
            //couldnt get the following to work so had to add the country filter as a literal string
            // var s = JSON.stringify(pictCountries);
            // s = s.substr(2, s.length - 4); //.replace(/"/g, "'");
            // var filter = ['in', 'name_en', s];
            var filter = ['in', 'name_en', "American Samoa", "Cook Islands", "Federated States of Micronesia", "Fiji", "French Polynesia", "Guam", "Kiribati", "Marshall Islands", "Nauru", "New Caledonia", "Niue", "Northern Mariana Islands", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tokelau", "Tonga", "Tuvalu", "Vanuatu", "Wallis and Futuna"];
            map.setFilter("Country label", filter);
        }

        function addCountriesTable() {
            var countriesPageHtml = "<table>";
            // var countryFeatures = getCountries(false);
            var countryFeatures = pictCountries;
            array.forEach(countryFeatures, function(feature) {
                var num = getArea(feature);
                var arrow = (feature == "Papua New Guinea") ? "<i class='fa fa-arrow-circle-right' aria-hidden='true' style='font-size:16px;cursor:pointer;padding-left:5px;color:grey' title='Zoom to " + feature + "'></i>" : "";
                countriesPageHtml += "<tr><td class='td1'>" + feature + "</td><td class='td2'>" + num + " Km<span style='font-size:9px;vertical-align: super; padding: 2px;'>2</span></td><td>" + arrow + "</td></tr>";
            });
            countriesPageHtml += "</table>";
            domConstruct.place(countriesPageHtml, dom.byId("countriesPage"), "first");
        }

        function addCountryTable() {
            var provincesHtml = "<table id='countryTable'>";
            var provinceFeatures = map.querySourceFeatures("composite", { sourceLayer: "Intact_Forest_Landscapes-24rowe" });
            array.forEach(provinceFeatures, function(feature) {
                provincesHtml += "<tr><td class='td1'>" + feature.properties.NAME_1 + "</td><td class='td2'>" + randomIntFromInterval(0, 100) + " Km<span style='font-size:9px;vertical-align: super; padding: 2px;'>2</span></td><td><i class='fa fa-arrow-circle-right' aria-hidden='true' style='font-size:16px;cursor:pointer;padding-left:5px;color:grey' title='Zoom to " + feature.properties.NAME_1 + "'></i></td></tr>";
            });
            provincesHtml += "</table>";
            domConstruct.place(provincesHtml, dom.byId("countryPage"));
        }

        function randomIntFromInterval(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        function addProvincesPopups() {
            removeProvincesPopups();
            if (map.getZoom() < 6) {
                return;
            }
            var provinceFeatures = map.querySourceFeatures("composite", { sourceLayer: "Intact_Forest_Landscapes-24rowe" });
            var provincesDone = [];
            array.forEach(provinceFeatures, function(feature) {
                if (provincesDone.indexOf(feature.properties.NAME_1) == -1) { //because we are getting the features from ALL rendered tiles there will be duplicate countries so only take the first one
                    provincesDone.push(feature.properties.NAME_1);
                    var num = randomIntFromInterval(0, 100);
                    var color = (num > 50) ? "#D0583B" : "#3974B1";
                    var yOffset = (feature.properties.NAME_1.length > 17) ? 50 : 40;
                    var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: [-51, yOffset] })
                        .setLngLat(feature.geometry.coordinates)
                        .setHTML("<div class='indicatorPopup'><span class='fa fa-circle-o-notch' aria-hidden='true' style='font-size:19px;padding-right:10px;color:" + color + "'></span><span>" + num + " Km<span style='font-size:9px;vertical-align: super; padding: 2px;'>2</span></span></div>")
                        .addTo(map);
                    provincePopups.push(popup);
                }
            });
        }

        function removeProvincesPopups() {
            array.forEach(provincePopups, function(provincePopup) {
                provincePopup.remove();
            });
            provincePopups = [];
        }
    });
