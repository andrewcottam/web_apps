import React, { useState, useEffect } from "react";
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import PowerLineExtension from './components/PowerLineExtension';
import PowerLineLayer from './components/PowerLineLayer';

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

// How many units of length are animated in 1 second
const ANIMATION_RATE = 0.002;

export default function App({ running }) {
  // variables
  const step = 1;
  const loopLength = 250;
  const [time, setTime] = useState(0);
  const [animation] = useState({});
  const animate = () => {
    setTime(t => (t + step) % loopLength);
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
          resolve(output_features);
        });
    })
  }

  return <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
    <TripsLayer
      data={getData(DATA_URL.POWER_LINES)}
      getPath={d => d.waypoints.map(p => p.coordinates)}
      // deduct start timestamp from each data point to avoid overflow
      getTimestamps={d => d.waypoints.map(p => p.timestamp)}
      getColor={[253, 128, 93]}
      opacity={0.8}
      widthMinPixels={6}
      jointRounded={true}
      capRounded={true}
      fadeTrail={true}
      trailLength={100}
      currentTime={time}
    />
  </DeckGL>;
}