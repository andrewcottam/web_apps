import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import { Fill, Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import { Overlay } from 'ol';
import { useGeographic } from "ol/proj";
import TileLayer from 'ol/layer/WebGLTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { apply } from 'ol-mapbox-style';

useGeographic();

// Vector tile sources
const vector_tiles_endpoint = 'https://storage.googleapis.com/restor_default/vector_tiles/sites/2025_03_02/mvt_tiles/{z}/{x}/{y}.pbf'; // restor sites
const vector_tile_source = new VectorTileSource({ format: new MVT(), url: vector_tiles_endpoint, maxZoom: 20 });
const mvt_layer_style = new Style({ stroke: new Stroke({ color: [255, 0, 0, 1], width: 1 }) });
const mvt_highlight_style = new Style({ fill: new Fill({ color: 'rgba(255, 255, 255, 0)', }), stroke: new Stroke({ color: 'rgba(255, 255, 255, 1)', width: 3 }) });

// Create the sites vector tile layer 
const vector_tile_layer = new VectorTileLayer({
    source: vector_tile_source, style: mvt_layer_style,
    style: function (feature) {
        const threshold = parseFloat(document.getElementById('slider').value);
        const featureValue = feature.get('area_km2'); // Replace with the actual property name
        return featureValue <= threshold ? mvt_layer_style : null; // Hide features that do not meet the threshold
    }
});
// Create the map
const map = new Map({
    target: 'map',
    // layers: [new TileLayer({ source: new OSM() }), vector_tile_layer],
    view: new View({ center: [0, 0], zoom: 0 }),

});

// Apply the MapTiler style
// const styleJson = `https://api.maptiler.com/maps/backdrop/style.json?key=67VOA297U9cciigsJVvm`;
const styleJson = 'https://api.maptiler.com/maps/dataviz/style.json?key=67VOA297U9cciigsJVvm'
apply(map, styleJson).then(() => {
    map.addLayer(vector_tile_layer);
    // Add the layer to the map
    map.addLayer(selection_layer);

});

// Create a selected feature
var selected_feature = {};
// Create a popup
var map_popup = new Overlay({ element: document.getElementById('popup') });
map.addOverlay(map_popup);

// Create the vector tile layer for the highlighted site 
const selection_layer = new VectorTileLayer({
    source: vector_tile_source, style: function (feature) {
        const props = feature.getProperties();
        if (props['id'] === selected_feature.current) {
            return mvt_highlight_style;
        }
    }
});

function getText(str) {
    var ret = (str !== undefined) ? str : '';
    return ret;
}
// Add the mouse move event
map.on(['pointermove'], function (mapEvent) {
    // Get the features which are under the mouse
    const features = map.getFeaturesAtPixel(mapEvent.pixel, { hitTolerance: 5 });
    // If there are some features
    if (features.length !== 0) {
        // Get the properties
        const props = features[0].getProperties();
        // Set the selection feature id
        selected_feature.current = props['id'];
        // Invalidate the layer so that it repaints
        selection_layer.changed();
        // Set the position of the site popup
        map_popup.setPosition(mapEvent.coordinate);
        var pu = document.getElementById('popup');
        if (props['id'] !== undefined) {
            pu.style.display = "block";
        } else {
            pu.style.display = "none";
        }
        pu.innerHTML = `
        <div style='font-size:12px;width:300px;color:gray;overflow:truncate'}>
            <table>
                <tbody>
                    <tr>
                        <td>id</td>
                        <td>` + props['id'] + `</td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td>` + props['name'] + `</td>
                    </tr>
                    <tr>
                        <td>Description</td>
                        <td>` + getText(props['desc']) + `</td>
                    </tr>
                    <tr>
                        <td>Site type</td>
                        <td>` + getText(props['site_type']) + `</td>
                    </tr>
                    <tr>
                        <td>Area (Km2)</td>
                        <td>` + getText(props['area_km2']) + `</td>
                    </tr>
                    <tr>
                        <td>Country</td>
                        <td>` + getText(props['iso2']) + `</td>
                    </tr>
                    <tr>
                        <td>Visibility</td>
                        <td>` + getText(props['visibility']) + `</td>
                    </tr>
                    <tr>
                        <td>Intervention start date</td>
                        <td>` + getText(props['intv_start']) + `</td>
                    </tr>
                    <tr>
                        <td>Stage</td>
                        <td>` + getText(props['stage']) + `</td>
                    </tr>
                    <tr>
                        <td>Pre-intervention land use</td>
                        <td>` + getText(props['pre_use']) + `</td>
                    </tr>
                    <tr>
                        <td>Intervention type</td>
                        <td>` + getText(props['intv_type']) + `</td>
                    </tr>
                    <tr>
                        <td>Post-intervention land use</td>
                        <td>` + getText(props['post_use']) + `</td>
                    </tr>
                    <tr>
                        <td>Created</td>
                        <td>` + getText(props['created']) + `</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }
});

// Update layer style when slider changes
document.getElementById('slider').addEventListener('input', function () {
    document.getElementById('slider-value').innerText = this.value;
    vector_tile_layer.setStyle(vector_tile_layer.getStyle());
});