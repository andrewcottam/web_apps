import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import { useGeographic } from "ol/proj";
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

useGeographic();

const layer = new TileLayer({
  source: new XYZ({
    url: 'https://storage.googleapis.com/imagery-tms/andrew%40gainforest.net/manaus/{z}/{x}/{-y}.png'
  })
});

const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), layer],
    view: new View({ center: [-60.645301,-2.951214], zoom: 19 }) 
});
