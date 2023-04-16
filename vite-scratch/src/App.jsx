import React, { useState, useEffect } from "react";
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl';
import ElectricLine from './components/ElectricLine';

const DATA_URL = {
  POWER_LINES: "https://raw.githubusercontent.com/andrewcottam/general/master/pwr.geojson"
};

const INITIAL_VIEW_STATE = {
  latitude: 52.207,
  longitude: 0.315,
  zoom: 8,
  minZoom: 2,
  maxZoom: 25
};
const MAP_STYLE = 'mapbox://styles/andrewcottam/clcsxyxcu002914qrsk95xyud';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5kcmV3Y290dGFtIiwiYSI6ImNsY3N4aHM5czB1YjkzbmxoNzN1NHk3aGYifQ.LzpyM7lJ5-f0vjshJoaNXg';

// How many units of length are animated in 1 second - controls the number of blobs per second - the higher the number the longer the blobs
const ANIMATION_RATE = 0.0006;

export default function App({ running }) {
  // variables
  const step = 1;
  const [time, setTime] = useState(0);
  const [animation] = useState({});

  const animate = () => {
    setTime(t => (t + step));
    animation.id = window.requestAnimationFrame(animate); // draw next frame
  };

  useEffect(() => {
    if (!running) {
      window.cancelAnimationFrame(animation.id);
      return;
    }
    animation.id = window.requestAnimationFrame(animate); // start animation
    return () => window.cancelAnimationFrame(animation.id);
  }, [running]);

  function getData(url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.json())
        .then((json) => {
          const output_features = [];
          //iterate through the features
          json.features.forEach((feature) => {
            // initialise the output feature array
            let waypoints = [], coords = [], prevCoord = [], longDiff = 0, latDiff = 0, ts = 0, totalTime = 0;
            //iterate through the coordinates
            coords = feature.geometry.coordinates;
            coords.forEach((coord, j, arr) => {
              //get the previous coord if j > 0 and calculate the timestamp based on the distance
              if (j > 0) {
                prevCoord = arr[j - 1]
                longDiff = coord[0] - prevCoord[0];
                latDiff = coord[1] - prevCoord[1];
                ts = (Math.sqrt(longDiff ** 2 + latDiff ** 2)) / ANIMATION_RATE;
                totalTime += ts;
              }
              waypoints.push({ coordinates: coord, timestamp: totalTime });
            })
            output_features.push({ waypoints: waypoints });
          })
          // console.log(output_features)
          resolve(output_features);
        });
    })
  }

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    <ElectricLine
      getTimestamps={d => d.waypoints.map(p => p.timestamp)}
      getPath={d => d.waypoints.map(p => p.coordinates)}
      data={getData(DATA_URL.POWER_LINES)}
      getColor={[253, 128, 93]}
      currentTime={time}
      widthMinPixels={4}
      capRounded={true}
      alphaFloor={0.3}
      wavelength={5}
      speed={50}
    />
    <StaticMap mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN}/>
  </DeckGL>;
}