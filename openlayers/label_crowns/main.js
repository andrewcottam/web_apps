import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import MVT from 'ol/format/MVT';
import GeoJSON from 'ol/format/GeoJSON';
import { Stroke } from 'ol/style';
import Style from 'ol/style/Style';
import RegularShape from 'ol/style/RegularShape';
import Fill from 'ol/style/Fill';
import Feature from 'ol/Feature';
import { useGeographic } from "ol/proj";
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/WebGLTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorLayer from 'ol/layer/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import Vector from 'ol/source/Vector';
import { transform } from "ol/proj";

useGeographic();

// Endpoints
const HOST = 'https://storage.googleapis.com'
// const HOST = 'http://127.0.0.1:1234/static'
// const PREFIX = 'finals/ortho'
const PREFIX = 'andrew%40gainforest.net/finals/ortho'
const TILE_SIZE = 1000
const TMS_ENDPOINT = `${HOST}/imagery-tms/${PREFIX}_100/{z}/{x}/{-y}.png`;
const MVT_ENDPOINT = `${HOST}/tree-detection-vector-tiles/${PREFIX}/${TILE_SIZE}/{z}/{x}/{y}.pbf`;


// TMS sources
const layer = new TileLayer({ source: new XYZ({ url: TMS_ENDPOINT }) });

// Vector tile sources
const _style = new Style({ stroke: new Stroke({ color: [255, 0, 0, 1], width: 2 }) });
const vector_tile_source = new VectorTileSource({ format: new MVT(), url: MVT_ENDPOINT, maxZoom: 20 });

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), layer, new VectorTileLayer({ source: vector_tile_source, style: _style })],
    view: new View({ center: [-60.740448, -2.96065], zoom: 20 })
});

function getFilenameWithoutExtension(path) {
    // Extract the filename part from the path
    const filenameWithExtension = path.split('/').pop();

    // Remove the extension from the filename
    const filenameWithoutExtension = filenameWithExtension.split('.').slice(0, -1).join('.');

    return filenameWithoutExtension;
}

var clicked_coordinate;

map.on('click', function (e) {
    const pixel = e.pixel;
    var photo_clicked = false;
    //get the photo the user clicked on
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
        photo_clicked = true;
        // get the url to the picture
        const filename = feature.getProperties().filename;
        const filename_no_ext = getFilenameWithoutExtension(filename);
        const url = `https://storage.googleapis.com/drone-canopy-images/${filename_no_ext} Large.jpeg`
        var iframe = document.getElementById('imageFrame');
        iframe.src = url;
    });
    if (photo_clicked == false) {
        //set the clicked coordinate
        clicked_coordinate = e.coordinate;
        var div = document.getElementById('species_entry');
        // set its position
        div.style.position = 'absolute';
        div.style.left = `${pixel[0]}px`;
        div.style.top = `${pixel[1]}px`;
        // show the species popup
        div.style.display = 'block';
    }
})

// Define a vector source to hold the GeoJSON data
var vectorSource = new Vector({
    format: new GeoJSON(),
    url: 'https://storage.googleapis.com/tree-detection-vector-tiles/finals_291_crowns.geojson',
    projection: 'EPSG:4326'
});

const styleFunction = function (feature) {
    const filename = feature.get('filename');
    let style;
    if (filename == null) {
        style = new Style({
            image: new RegularShape({
                fill: new Fill({ color: 'red' }),
                points: 3,
                radius: 20,
                angle: 0
            })
        })
    } else {
        style = new Style({
            image: new RegularShape({
                fill: new Fill({ color: 'white' }),
                points: 3,
                radius: 10,
                angle: 0
            })
        })
    }
    return style;
};

// Function to download the features as GeoJSON
function downloadGeoJSON() {
    var features = vectorLayer.getSource().getFeatures();
    var geojsonFormat = new GeoJSON();
    var geojsonStr = geojsonFormat.writeFeatures(features, {
        featureProjection: 'EPSG:3857', // or the projection of your map
        dataProjection: 'EPSG:4326'
    });

    // Create a Blob from the GeoJSON string
    var blob = new Blob([geojsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    // Create a download link and trigger the download
    var a = document.createElement('a');
    a.href = url;
    a.download = 'features.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// add a listener to download
document.addEventListener('keydown', function (event) {
    // Your code here
    // console.log(`Key pressed: ${event.key}`);
    if (event.key === 'Tab') {
        downloadGeoJSON();
    }
    if (event.key === 'Enter') {
        // save the species record
        var species = document.getElementById('textInput').value;
        // Create a new feature with the click coordinates as lat/long
        var lonLat = transform(clicked_coordinate, 'EPSG:3857', 'EPSG:4326');
        const feature = new Feature({
            geometry: new Point(clicked_coordinate),
            species: species,
            lat: clicked_coordinate[1], 
            lon: clicked_coordinate[0]
        });
        // Add the feature to the vector source
        vectorSource.addFeature(feature);
        var div = document.getElementById('species_entry');
        div.style.display = 'none';
    }
});

// Create a vector layer using the vector source
var vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction
});

// Add the vector layer to the map
map.addLayer(vectorLayer);