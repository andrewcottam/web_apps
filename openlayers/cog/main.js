import { Map } from 'ol';
import proj4 from 'proj4';
import OSM from 'ol/source/OSM.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import { fromEPSGCode, register } from 'ol/proj/proj4.js';
import { transform } from 'ol/proj';

register(proj4);

// COG sources
const source = new GeoTIFF({ sources: [{ url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif' }] });

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), new TileLayer({ source: source })],
    view: source.getView().then((viewConfig) => fromEPSGCode(viewConfig.projection.getCode()).then(() => viewConfig)) // sets the map view projection to EPSG:32615
});

map.on('singleclick', function (evt) {
    const coordinate = evt.coordinate;
    const projection = map.getView().getProjection().getCode();
    const lonLat = transform(coordinate, projection, 'EPSG:4326');
    console.log(`Clicked at longitude: ${lonLat[0]}, latitude: ${lonLat[1]}`);
});