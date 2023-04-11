import DeckGL from '@deck.gl/react';
import {GeoJsonLayer} from '@deck.gl/layers';

const DATA_URL = {
  POWER_LINES: "https://raw.githubusercontent.com/andrewcottam/general/master/open%20street%20map%20power%20lines%20in%20england.geojson"
};

const INITIAL_VIEW_STATE = {
  latitude: 54,
  longitude: 0,
  zoom: 7,
  minZoom: 2,
  maxZoom: 18
};

export default function App({data=DATA_URL.POWER_LINES }) {

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    <GeoJsonLayer data={data} lineWidthMinPixels={0.5}/>
  </DeckGL>;
}