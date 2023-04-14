import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import PowerLineExtension from './components/PowerLineExtension';
import PowerLineLayer from './components/PowerLineLayer';

const DATA_URL = {
  POWER_LINES: "https://raw.githubusercontent.com/andrewcottam/general/master/pwrlinesll2.geojson"
};

const INITIAL_VIEW_STATE = {
  latitude: 52.207,
  longitude: 0.315,
  zoom: 13,
  minZoom: 2,
  maxZoom: 25
};

export default function App() {

  function getData(url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.json())
        .then((json) => {
          const coords = json.features[0].geometry.coordinates;
          const out = coords.map((item, i, arr) => {
            return { from: arr[i], to: arr[i + 1] }
          })
          //remove the last item as it will have an end point of undefined
          resolve(out.slice(0,out.length-1))
        });
    })
  }
  
  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    {/* <GeoJsonLayer
      data={data}
      extensions={[new PowerLineExtension()]}
      lineWidthMinPixels={10}
      getLineColor={[0, 200, 255]}
      getLineLength={d => (d.properties.length)}
      animationSpeed={2} tailLength={3}
    /> */}
    <PowerLineLayer
      data={getData(DATA_URL.POWER_LINES)}
      widthMinPixels={5}
      getSourcePosition={d => d.from}
      getTargetPosition={d => d.to}
      getColor={[0, 200, 255]}
      getFrequency={0.1}
      animationSpeed={1}
      tailLength={3}
    />
  </DeckGL>;
}