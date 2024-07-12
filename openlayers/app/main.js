import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import MVT from 'ol/format/MVT';
import { Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import { useGeographic } from "ol/proj";
import TileLayer from 'ol/layer/WebGLTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';

useGeographic();

// Endpoints
const HOST = 'https://storage.googleapis.com'
// const HOST = 'http://127.0.0.1:1234/static'
const PREFIX = 'finals/ortho'
const TILE_SIZE = 1000
const TMS_ENDPOINT = `${HOST}/imagery-tms/${PREFIX}/{z}/{x}/{-y}.png`;
const MVT_ENDPOINT = `${HOST}/tree-detection-vector-tiles/${PREFIX}/${TILE_SIZE}/{z}/{x}/{y}.pbf`;

// TMS sources
const layer = new TileLayer({source: new XYZ({url: TMS_ENDPOINT})});

// Vector tile sources
const _style = new Style({ stroke: new Stroke({ color: [255, 0, 0, 1], width: 2 }) });
const vector_tile_source = new VectorTileSource({ format: new MVT(), url: MVT_ENDPOINT, maxZoom: 20 });

new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }),layer, new VectorTileLayer({ source: vector_tile_source, style: _style })],
    view: new View({ center: [-60.740448,-2.96065], zoom: 20 }) 
});