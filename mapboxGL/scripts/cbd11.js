/*global turf */
require(["dijit/registry", "dojo/_base/lang", "dojo/request/script", "dojo/dom-style", "dijit/registry", "dojo/_base/array", "dojo/json", "dojo/store/Memory", "dojo/request/xhr", "dojo/dom", "dijit/form/Select", "dojo/parser", "dijit/form/HorizontalSlider", "dojo/on", "node_modules/mapbox-gl/dist/mapbox-gl.js"],
    function(registry, lang, script, domStyle, registry, array, json, Memory, xhr, dom, Select, parser, HorizontalSlider, on, mapboxgl) {
        var countryStore, selectedCountry, currentYear = 2020,
            restServerUrl = "https://db-server-blishten.c9users.io/cgi-bin/services.py/biopama/services/";
        parser.parse();
        new HorizontalSlider({
            name: "slider",
            value: 2020,
            minimum: 1900,
            maximum: 2020,
            discreteValues: 121,
            intermediateChanges: true,
            style: "width:300px;",
            showButtons: false,
            onChange: function(value) {
                currentYear = value;
                setMapFilter();
                showYearStatistics();
                dom.byId("year").innerHTML = value;
            }
        }, "slider").startup();
        mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg'; //this is my access token
        var map = new mapboxgl.Map({
            container: 'map',
            style: "mapbox://styles/blishten/cj6q75jcd39gq2rqm1d7yv5rc",
            center: [21, -2], //salonga
            zoom: 4,
            hash: true,
        });
        //add the map events
        map.on("load", function(e) {
            addLayerWDPA();
            addCountrySelector();
            addTurfOutputsLayer();
            // console.log("load " + e);
        });
        //called each time a tile is rendered
        map.on("render", function(e) {
            var features = map.queryRenderedFeatures({ layers: ['WDPA'] });
            console.log(features.length + " rendered features");
            //calculateArea();
            // calculateAreaTurf();
        });
        //called when the country changes
        map.on("movestart", function(e) {
            invalidateArea();
        });
        map.on("error", function(e) {
            console.error(e.error);
        });

        map.on("click", function() {
            var features = map.queryRenderedFeatures({ layers: ['WDPA'] });
            if (features.length) {
                var fc = turf.featureCollection(features);
                // var fc = turf.featureCollection([features[3],features[8]]);
                // var combined = turf.dissolve(fc);
                var combined = turf.flatten(fc);
                // var combined = turf.union.apply(this, features);
                map.getSource('turf-outputs').setData({
                    type: 'FeatureCollection',
                    features: combined.features
                });
                map.addLayer({
                    id: 'turf-outputs-layer',
                    type: 'fill',
                    source: 'turf-outputs',
                    paint: {
                        "fill-color": "#0000ff",
                        "fill-outline-color": "#ff0000"
                    }
                });
            }
        });

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
                            ["0", "rgba(99,148,69, 0.5)"],
                            ["1", "rgba(63,127,191, 0.5)"],
                            ["2", "rgba(63,127,191, 0.5)"]
                        ]
                    },
                    "fill-outline-color": {
                        "type": "categorical",
                        "property": "MARINE",
                        "stops": [
                            ["0", "rgba(99,148,69, 0.5)"],
                            ["1", "rgba(63,127,191, 0.5)"],
                            ["2", "rgba(63,127,191, 0.5)"]
                        ]
                    }
                }
            }, "place-island");
            map.addLayer({
                "id": "WDPA_selected",
                "type": "fill",
                "source": {
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
                            ["0", "rgba(255,0,0, 0.7)"],
                            ["1", "rgba(255,0,0, 0.7)"],
                            ["2", "rgba(255,0,0, 0.7)"]
                        ]
                    },
                    "fill-outline-color": {
                        "type": "categorical",
                        "property": "MARINE",
                        "stops": [
                            ["0", "rgba(255,0,0, 0.7)"],
                            ["1", "rgba(255,0,0, 0.7)"],
                            ["2", "rgba(255,0,0, 0.7)"]
                        ]
                    }
                }
            }, "place-island");
            map.addLayer({
                "id": "WDPA_names",
                "type": "symbol",
                "source": {
                    type: 'vector',
                    url: 'mapbox://blishten.6bj0u9pi'
                },
                "source-layer": "Archive-5rpwu0",
                "layout": {
                    "text-field": "{NAME}",
                    "text-size": 13
                },
                "paint": {
                    "text-halo-width": 1,
                    "text-halo-blur": 1,
                    "text-halo-color": "hsla(0, 0%, 100%, 0.8)"
                }
            }, "place-island");
        }

        function zoomToCountry() {
            xhr("https://api.mapbox.com/geocoding/v5/mapbox.places/" + selectedCountry.item.name + ".json?access_token=pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg&country=" + selectedCountry.item.alpha2Code).then(function(data) {
                var jsonData = json.parse(data);
                if (jsonData.features.length > 0) {
                    var feature = jsonData.features[0];
                    if (feature.hasOwnProperty("bbox")) {
                        map.fitBounds(feature.bbox);
                    }
                }
            });
        }

        function getCountryCoverageStats() {
            script.get(restServerUrl + "get_wdpa_terrestrial_coverage_statistics", {
                query: {
                    iso3code: selectedCountry.item.alpha3Code
                },
                jsonp: "callback"
            }).then(function(response) {
                if (!response.metadata.success) {
                    alert('Unable to login. ' + response.metadata.error);
                }
                else {
                    if (response.records.length > 0) {
                        console.log(response.records);
                        lang.mixin(selectedCountry, {
                            terrestrial_coverage: response.records

                        });
                        showCountryArea();
                        showYearStatistics();
                        populateChart();
                    }
                }
            });
        }

        function showCountryArea() {
            if (selectedCountry.item.area) {
                domStyle.set("info", "display", "block");
                dom.byId("intarea2").innerHTML = parseInt(selectedCountry.item.area).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
            }

        }

        function showYearStatistics() {
            if (selectedCountry.terrestrial_coverage) {
                var yr = registry.byId("slider").value;
                var totalArea;
                array.forEach(selectedCountry.terrestrial_coverage, function(item) {
                    if (item.yr <= yr) {
                        totalArea = item.cum_area;
                    }
                });
                dom.byId("intarea").innerHTML = parseInt(totalArea).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
                var percentProtected = (totalArea > 0) ? parseFloat((totalArea / selectedCountry.item.area) * 100).toFixed(1) : "0";
                dom.byId("percentage").innerHTML = percentProtected.toString();
                (percentProtected >= 17) ? domStyle.set("percentage", "color", "forestgreen"): domStyle.set("percentage", "color", "crimson");
            }
        }

        function populateChart() {

        }

        function addCountrySelector() {
            //populate the select box with countries and codes from an external service
            xhr("https://restcountries.eu/rest/v2/all").then(function(data) {
                var storeData = json.parse(data);
                storeData.unshift({ alpha2Code: null, alpha3Code: null, name: " None " });
                countryStore = new Memory({
                    idProperty: "alpha2Code",
                    data: storeData
                });
                new Select({
                    name: "countrySelect",
                    store: countryStore,
                    labelAttr: "name",
                    onChange: function(value) {
                        //get the selected item in the drop down
                        array.forEach(this.options, function(item) {
                            if (item.selected) {
                                selectedCountry = item;
                            }
                        });
                        if (selectedCountry.item.name == " None ") {
                            selectedCountry = null;
                        }
                        //get the bounding box from the mapbox geocoding api
                        if (selectedCountry) {
                            getCountryCoverageStats();
                            zoomToCountry();
                        }
                        setMapFilter();
                    }
                }).placeAt(dom.byId("countries")).startup();
            }, function(err) {
                alert("Unable to get data from https://restcountries.eu/rest/all/" + err);
            });
        }

        function addTurfOutputsLayer() {
            map.addSource('turf-outputs', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
        }

        function setMapFilter() {
            if (selectedCountry) {
                map.setFilter("WDPA", ["all", ["<", "STATUS_YR", currentYear],
                    ["==", "PARENT_ISO", selectedCountry.item.alpha3Code]
                ]);
                map.setFilter("WDPA_selected", ["all", ["==", "STATUS_YR", currentYear],
                    ["==", "PARENT_ISO", selectedCountry.item.alpha3Code]
                ]);
                map.setFilter("WDPA_names", ["all", ["==", "STATUS_YR", currentYear],
                    ["==", "PARENT_ISO", selectedCountry.item.alpha3Code]
                ]);
            }
            else {
                map.setFilter("WDPA", null);
                map.setFilter("WDPA_selected", null);
                map.setFilter("WDPA_names", null);
            }
        }

        function invalidateArea() {
            domStyle.set("info", "display", "none");
        }

        function calculateArea() {
            console.log("calculateArea")
            var totalArea = 0;
            var wdpaids = [];
            var features = map.queryRenderedFeatures({ layers: ['WDPA'] });
            array.forEach(features, function(feature) {
                if (wdpaids.indexOf(feature.properties.WDPAID) == -1) {
                    totalArea = totalArea + feature.properties.REP_AREA; // marine area is REP_M_AREA
                    // console.log("xyz:" + feature._vectorTileFeature._x + "_" + feature._vectorTileFeature._y + "_" + feature._vectorTileFeature._z + " wdpaid:" + feature.properties.WDPAID);
                    wdpaids.push(feature.properties.WDPAID);
                }
            });
            domStyle.set("info", "display", "block");
            dom.byId("intarea").innerHTML = parseInt(totalArea).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
            dom.byId("intarea2").innerHTML = parseInt(selectedCountry.item.area).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
            var percentProtected = (totalArea > 0) ? parseFloat((totalArea / selectedCountry.item.area) * 100).toFixed(1) : "0";
            dom.byId("percentage").innerHTML = percentProtected.toString();
            (percentProtected >= 17) ? domStyle.set("percentage", "color", "forestgreen"): domStyle.set("percentage", "color", "crimson");
        }

        function calculateAreaTurf() {
            var totalArea = 0;
            var features = map.queryRenderedFeatures({ layers: ['WDPA'] });
            if (features.length) {

                //var feature = turf.union(features[0],features[1]); //fails with TopologyException", message: "side location conflict 



                // var feature = features[0];
                // for (var i = 1; i < features.length; i++) {
                //     feature = turf.union(feature, features[i]);
                // }
                // var totalArea = turf.area(feature) / 1000000;
                // if (totalArea > 0) {
                //     var percentProtected = parseFloat((totalArea / selectedCountry.item.area) * 100).toFixed(1);
                //     domStyle.set("info", "display", "block");
                //     dom.byId("intarea").innerHTML = parseInt(totalArea).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
                //     dom.byId("intarea2").innerHTML = parseInt(selectedCountry.item.area).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //puts a comma in if needed
                //     dom.byId("percentage").innerHTML = percentProtected.toString();
                //     (percentProtected >= 17) ? domStyle.set("percentage", "color", "forestgreen"): domStyle.set("percentage", "color", "crimson");
                // }
            }
        }
    });
