/*global L*/
/*global vectorTileStyling*/
require(["styles/vectorTileDefault.js", "scripts/sequentialLoader!./leaflet/leaflet.js", "scripts/sequentialLoader!./leaflet/Leaflet.fullscreen.js", "scripts/sequentialLoader!./leaflet/Leaflet.VectorGrid.bundled.min.js", "scripts/sequentialLoader!../widgets/scripts/vectorTileLayer.js"], function() {
    var vectorTileOptions = {
        rendererFactory: L.svg.tile,
        interactive: true,
        attribution: '<a href="https://openmaptiles.org/"></a><a href="http://www.openstreetmap.org/copyright">&copy; OpenStreetMap</a>',
        vectorTileLayerStyles: vectorTileStyling,
        subdomains: '0123', //necessary for openmaps.org
        maxZoom: 16,
        getFeatureId: function(f) {
            return f.properties.class;
        }
    };
    //create the osm vector tile layers
    var openmapsLayer = L.vectorTileLayer("https://free-{s}.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=UmmATPUongHdDmIicgs7", vectorTileOptions); //openmaps.org
    var mapboxLayer = L.vectorTileLayer("https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.mvt?access_token=pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg", vectorTileOptions); //mapbox
    var mapzenLayer = L.vectorTileLayer("https://tile.mapzen.com/mapzen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-VyYjZGS", vectorTileOptions); //mapzen
    var esriLayer = L.vectorTileLayer("https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{x}/{y}.pbf", vectorTileOptions); //esri
    //create the wdpa vector tile layer
    var wdpaLayer = L.vectorTileLayer("https://storage.googleapis.com/geeimageserver.appspot.com/wdpa_africa/{z}/{x}/{y}.pbf", {
        rendererFactory: L.svg.tile,
        interactive: true,
        attribution: 'UNEP-WCMC WDPA',
        vectorTileLayerStyles: {
            protected_areas: {
                fill: true,
                weight: 1,
                fillColor: "rgba(99,148,69, 0.9)",
                color: "rgba(87,131,61, 0.9)",
            }
        },
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
        layers: [openmapsLayer, wdpaLayer]
    });
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
