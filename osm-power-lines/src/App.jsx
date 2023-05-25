import React from "react";
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl';
import { MVTLayer } from '@deck.gl/geo-layers';

const MAP_STYLE = 'mapbox://styles/andrewcottam/clcsxyxcu002914qrsk95xyud';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5kcmV3Y290dGFtIiwiYSI6ImNsY3N4aHM5czB1YjkzbmxoNzN1NHk3aGYifQ.LzpyM7lJ5-f0vjshJoaNXg';
const INITIAL_VIEW_STATE = {
  latitude: 52.207,
  longitude: 0.315,
  zoom: 8,
  minZoom: 2,
  maxZoom: 25
};


export default function App({ running }) {

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true} getTooltip={(feature) => {
    // if (feature.hasOwnProperty('object')) {
    //   if (feature.object.geometry.type === 'MultiLineString') console.log(feature.object.properties)
    //   if (feature.object.geometry.type === 'MultiPoint') console.log(feature.object.properties)
    // }
  }}>
    <MVTLayer data={"https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf"}
      getFillColor={(f) => {
        switch (f.properties.layerName) {
          case 'power pole':
            return [255, 0, 0];
          case 'power tower':
            return [255, 0, 0];
          default:
            return [255, 255, 255, 0];
        }
      }}
      getLineColor={(f) => {
        switch (f.properties.layerName) {
          case 'power line':
            return [0, 0, 255];
          case 'power minor line':
            return [0, 0, 255];
          case 'power major line':
            return [0, 255, 0];
          default:
            return [128, 128, 0];
        }
      }}
      getLineWidth={(f) => {
        switch (f.properties.layerName) {
          case 'power line':
            return 6;
          case 'power minor line':
            return 6;
          case 'power major line':
            return 6;
          default:
            return 0;
        }
      }}
      getPointRadius={(f) => {
        switch (f.properties.layerName) {
          case 'power tower':
            return 6;
          case 'power pole':
            return 5;
          default:
            return 1;
        }
      }}
      pickable={true}
    />
    <StaticMap mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
  </DeckGL>;
}