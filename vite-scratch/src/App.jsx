import React from "react";
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl';
import PowerLineLayer from './components/PowerLineLayer';

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

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    <PowerLineLayer data={'https://raw.githubusercontent.com/andrewcottam/general/master/pwr.geojson'}  />
    <StaticMap mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
  </DeckGL>;
}