import DeckGL from '@deck.gl/react';
import { PointCloudLayer } from '@deck.gl/layers';
import { OrbitView, COORDINATE_SYSTEM } from '@deck.gl/core';

export default function App({ data, viewState }) {
  
  const INITIAL_VIEW_STATE = {
    target: [0, 0, 0],
    zoom: 4,
    rotationOrbit: 0,
    rotationX: 0,
    minRotationX: -90,
    maxRotationX: 90,
    minZoom: -10,
    maxZoom: 10
  }

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} views={[new OrbitView()]} controller={true} width={600}>
    <PointCloudLayer data={data} coordinateSystem={COORDINATE_SYSTEM.CARTESIAN} pointSize={4} getPosition={d => d.position} getNormal={d => d.normal} getColor={d => d.color} />
  </DeckGL>;
}