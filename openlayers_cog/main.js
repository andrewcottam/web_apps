import { Map } from 'ol';
import OSM from 'ol/source/OSM.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import proj4 from 'proj4';
import { fromEPSGCode, register } from 'ol/proj/proj4.js';

register(proj4);
// const source = new GeoTIFF({ sources: [{ url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif' }] });
const source = new GeoTIFF({ sources: [{ url: 'https://storage.googleapis.com/imagery-opendronemap-output/andrew@gainforest.net/NFjmpJ21YorJTJEXXnE7/lightning-results/odm_orthophoto/odm_orthophoto.tif' }] });

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), new TileLayer({ source: source })],
    // view: v,
    view: source.getView().then((viewConfig) =>
        fromEPSGCode(viewConfig.projection.getCode()).then(() => viewConfig),
    )
});

map.on('singleclick', function (evt) {
    console.log(map.getView())
});