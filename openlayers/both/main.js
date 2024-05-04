import proj4 from 'proj4';
import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import { Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import { useGeographic } from "ol/proj";
import {register} from 'ol/proj/proj4.js';
import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';

useGeographic();
proj4.defs("EPSG:32615","+proj=utm +zone=15 +datum=WGS84 +units=m +no_defs +type=crs");
register(proj4);

// COG sources
const source = new GeoTIFF({ sources: [{ projection: "EPGS:32615", url: 'https://storage.googleapis.com/imagery-opendronemap-output/andrew@gainforest.net/NFjmpJ21YorJTJEXXnE7/lightning-results/odm_orthophoto/odm_orthophoto.tif' }] });

// Vector tile sources
const _style = new Style({ stroke: new Stroke({ color: [0, 153, 255, 1], width: 2 }) });
const vector_tiles_endpoint = 'https://storage.googleapis.com/tree-detection-vector-tiles/andrew@gainforest.net/3GP2bDcLy7vDgnPvU3Vn/mvt_tiles/{z}/{x}/{y}.pbf';
const vector_tile_source = new VectorTileSource({ format: new MVT(), url: vector_tiles_endpoint, maxZoom: 20 });

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), new TileLayer({ source: source }), new VectorTileLayer({ source: vector_tile_source, style: _style })],
    view: new View({ center: [-91.993929, 46.842557], zoom: 18 }) //maps projection is set to EPSG:3857 by default
});

map.on('singleclick', function (evt) {
    console.log(map.getView())
});