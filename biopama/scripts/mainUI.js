/*global L*/
define(["dojo/_base/declare", "scripts/sequentialLoader!./leaflet/leaflet.js", "scripts/sequentialLoader!./leaflet/Leaflet.fullscreen.js", "scripts/sequentialLoader!./leaflet/Leaflet.VectorGrid.bundled.min.js", "scripts/sequentialLoader!./leaflet/vectorTileLayer.js"], function(declare) {
    return declare(null, {
        createMap: function(lat, lng, zoom) {
            this.map = L.map('map', {
                fullscreenControl: true,
            }).setView([lat, lng, zoom], zoom);
        },
        addTileLayer: function(url, options) {
            new L.tileLayer(url, options).addTo(this.map);
        },
    });
});
