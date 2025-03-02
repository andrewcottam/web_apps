import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import { Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import { useGeographic } from "ol/proj";
import TileLayer from 'ol/layer/WebGLTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';

useGeographic();

// Vector tile sources
const _style = new Style({ stroke: new Stroke({ color: [0, 153, 255, 1], width: 2 }) });
const vector_tiles_endpoint = 'https://storage.googleapis.com/restor_default/vector_tiles/sites/2025_03_02j/mvt_tiles/{z}/{x}/{y}.pbf'; // restor sites

const vector_tile_source = new VectorTileSource({ format: new MVT(), url: vector_tiles_endpoint, maxZoom: 20 });
const mvt_layer_style = new Style({ stroke: new Stroke({ color: [255, 0, 0, 1], width: 2 }) });
// Create the vector tile layer 
const vector_tile_layer = new VectorTileLayer({ source: vector_tile_source, style: mvt_layer_style});

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), vector_tile_layer],
    view: new View({ center: [0,0], zoom: 0 }) 
});

map.on('singleclick', function (evt) {
    console.log(map.getView())
});