/*global L*/
/*global vectorTileStyling*/
require(["dojo/request/script", "dojo/_base/lang", "dojo/keys", "dojo/query", "dojo/on", "node_modules/leaflet-geosearch/dist/bundle.min.js", "styles/vectorTileDefault.js", "scripts/sequentialLoader!./leaflet/leaflet.js", "scripts/sequentialLoader!./leaflet/Leaflet.fullscreen.js", "scripts/sequentialLoader!./leaflet/Leaflet.VectorGrid.bundled.min.js", "scripts/sequentialLoader!../widgets/scripts/vectorTileLayer.js", "scripts/sequentialLoader!../widgets/scripts/L.Control.MousePosition.js"],
    function(script, lang, keys, query, on, geoSearch) {
        var vectorTileOptions = {
            rendererFactory: L.svg.tile,
            // rendererFactory: L.canvas.tile,
            interactive: true,
            attribution: '<a href="https://openmaptiles.org/"></a><a href="http://www.openstreetmap.org/copyright">&copy; OpenStreetMap</a>',
            vectorTileLayerStyles: vectorTileStyling,
            subdomains: '0123', //necessary for openmaps.org
            maxNativeZoom: 14,
            maxZoom: 19,
            getFeatureId: function(f) {
                return f.properties.class;
            }
        };
        //create the osm vector tile layers
        var openmapsLayer = L.vectorTileLayer("https://free-{s}.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=UmmATPUongHdDmIicgs7", vectorTileOptions, { debug: false }); //openmaps.org
        var mapboxLayer = L.vectorTileLayer("https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.mvt?access_token=pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg", vectorTileOptions, { debug: false }); //mapbox
        var mapzenLayer = L.vectorTileLayer("https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-VyYjZGS", vectorTileOptions, { debug: false }); //mapzen
        var esriLayer = L.vectorTileLayer("https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{x}/{y}.pbf", vectorTileOptions, { debug: false }); //esri
        //create the wdpa vector tile layer
        var wdpaLayer = L.vectorTileLayer("https://storage.googleapis.com/geeimageserver.appspot.com/wdpa_africa/{z}/{x}/{y}.pbf", {
            rendererFactory: L.svg.tile,
            interactive: true,
            attribution: 'UNEP-WCMC WDPA',
            vectorTileLayerStyles: vectorTileStyling,
            maxZoom: 16,
            getFeatureId: function(f) {
                return f.properties.WDPAID;
            }
        }, {
            kind: "Protected area"
        });
        var map = L.map('map', {
            center: [16.5887, -14.8975],
            zoom: 12,
            layers: [openmapsLayer],
            loadingControl: true,
            fullscreenControl: true,
        });
        L.control.scale().addTo(map);
        //add the search control
        var provider = new geoSearch.OpenStreetMapProvider({
            params: {
                namedetails: 1
            }
        });
        const searchControl = new geoSearch.GeoSearchControl({
            provider: provider,
            autoClose: true,
        });
        map.addControl(searchControl);
        query("input.glass").on("keydown", function(e) {
            if (e.keyCode == keys.ENTER) {
                script.get("https://nominatim.openstreetmap.org/lookup?", {
                    query: {
                        osm_ids: this.value,
                        format: "json",
                    },
                    jsonp: "json_callback"
                }).then(function(data) {
                    if (data && data.length != 0) {
                        map.setView([data[0].lat, data[0].lon], 17);
                    }
                }, function(err) {
                    console.error(err);
                });
            }
        });
        //     if (e.keyCode == keys.ENTER) {
        //             // if ((e.srcElement.tagName == "INPUT") && (e.srcElement.placeholder == "Enter address") && (e.key == "Enter")) {
        //             //     provider.options.params = {
        //             //         osm_ids: "R146656,W104393803,N240109189",
        //             //         q: "",
        //             //     };
        // L.control.mousePosition().addTo(map);
        //objects to pass to the layers control
        var osmLayers = {
            "openmaps.org": openmapsLayer,
            "MapBox": mapboxLayer,
            "MapZen": mapzenLayer,
            "ESRI": esriLayer,
        };
        var otherLayers = {
            "WDPA": wdpaLayer
        };
        //add the layer control
        L.control.layers(osmLayers, otherLayers).addTo(map);
    });
