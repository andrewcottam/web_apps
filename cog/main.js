import { Map } from 'ol';
import OSM from 'ol/source/OSM';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';
import proj4 from 'proj4';
import { fromEPSGCode, register } from 'ol/proj/proj4';

register(proj4);
// const source = new GeoTIFF({ sources: [{ url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif' }] });
const source = new GeoTIFF({ sources: [{ url: 'https://storage.googleapis.com/imagery-opendronemap-output/andrew@gainforest.net/NFjmpJ21YorJTJEXXnE7/lightning-results/odm_orthophoto/odm_orthophoto.tif' }] });

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), new TileLayer({ source: source })],
    // view: source.getView(), //basemap not in the right place

    // view: source.getView().then((viewConfig) => //basemap not in the right place
    //     {
    //         console.log(viewConfig);
    //         return viewConfig;
    //     })

    view: source.getView().then((viewConfig) => //basemap in the right place
        fromEPSGCode(viewConfig.projection.getCode()).then((proj) => {
            console.log(viewConfig);
            // console.log(proj);
            return viewConfig;
        }))
});

map.on('singleclick', function (evt) {
    console.log(map.getView())
    console.log(source.getView().then(g => console.log(g)))
});