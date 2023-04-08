import DeckGL from '@deck.gl/react';
import {PointCloudLayer} from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';

export default function App({data, viewState}) {
  /**
   * Data format:
   * [
   *   {position: [-122.4, 37.7, 12], normal: [-1, 0, 0], color: [255, 255, 0]},
   *   ...
   * ]
   */
  const INITIAL_VIEW_STATE = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 1,
    pitch: 0,
    bearing: 0
  };
  
  const layer = new PointCloudLayer({
    id: 'point-cloud-layer',
    data: [{position: [-122.4, 37.7, 12], normal: [-1, 0, 0], color: [255, 255, 0]}],
    pickable: false,
    coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
    coordinateOrigin: [-122.4, 37.74],
    radiusPixels: 4,
    getPosition: d => d.position,
    getNormal: d => d.normal,
    getColor: d => d.color
  });

  return <DeckGL initialViewState={INITIAL_VIEW_STATE}
    layers={[layer]}
    getTooltip={({object}) => object && object.position.join(', ')} controller={true}/>;
}