import React, { useState, useEffect } from "react";
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl';
import {load} from '@loaders.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {LASLoader} from '@loaders.gl/las';
import {PointCloudLayer} from '@deck.gl/layers';
import PowerLineLayer from './components/PowerLineLayer';
import LAZ_SAMPLE from './test.laz'

const MAP_STYLE = 'mapbox://styles/andrewcottam/clcsxyxcu002914qrsk95xyud';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5kcmV3Y290dGFtIiwiYSI6ImNsY3N4aHM5czB1YjkzbmxoNzN1NHk3aGYifQ.LzpyM7lJ5-f0vjshJoaNXg';
const PUBLIC_LAZ = 'https://storage.googleapis.com/andrewcottam-public/test.laz'

// cambridge
// const INITIAL_VIEW_STATE = {
//   latitude: 52.207,
//   longitude: 0.315,
//   zoom: 8,
//   minZoom: 2,
//   maxZoom: 25
// };
// california LAZ file
const INITIAL_VIEW_STATE = {
  latitude: 36.17188,
  longitude: -118.95225,
  zoom: 13,
  minZoom: 2,
  maxZoom: 25
};
// for indoor.laz
// const INITIAL_VIEW_STATE = {
//   latitude: 0,
//   longitude: 0,
//   zoom: 10,
//   minZoom: 2,
//   maxZoom: 25
// };

export default function App({ running }) {

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    {/* <PowerLineLayer data={'https://raw.githubusercontent.com/andrewcottam/general/master/pwr.geojson'}  /> */}
    {/* <PointCloudLayer data={'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/point-cloud-laz/indoor.0.1.laz'} loaders={[LASLoader]}/> */}
    {/* <PointCloudLayer data={PUBLIC_LAZ} loaders={[LASLoader]} /> */}
    <PointCloudLayer data={LAZ_SAMPLE} loaders={[LASLoader]} coordinateSystem={COORDINATE_SYSTEM.METER_OFFSETS} coordinateOrigin={[-120, 0, 0]}/> {/* coordinate system is 32611 UTM 11N */}
    <StaticMap mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
  </DeckGL>;
}