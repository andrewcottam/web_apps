/*global mapboxgl*/
import React from 'react';
import './App.css';

class App extends React.Component {
  componentDidMount() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';
    this.map = new mapboxgl.Map({
      container: window.document.getElementById('map'),
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [-14.9557759, 16.6539413],
      zoom: 16
    });
    this.map.on('load', _ => {
      this.map.addLayer({
        'source': {
          'type': 'geojson',
          // return a single osm feature - geojson format
          // 'data': 'https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OpenStreetMap_Buildings_for_AFR/FeatureServer/0/query?where=osm_id2%3D%27832603018%27&f=pgeojson',
          
          // return all features - returns 2000 features but not in the current view extent! - geojson format
          // 'data': 'https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OpenStreetMap_Buildings_for_AFR/FeatureServer/0/query?where=osm_id2%3E0&f=pgeojson',
          
          // filter the osm features by geometry (in this case the port area in Podor, Senegal) - geojson format
          'data': 'https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OpenStreetMap_Buildings_for_AFR/FeatureServer/0/query?geometry=%7B%0D%0A++%22rings%22+%3A+%5B%5B%5B-1664900%2C+1880500%5D%2C+%5B-1664900%2C+1880600%5D%2C%0D%0A+++++++++++++++++++++++++++%5B-1664800%2C+1880600%5D%2C+%5B-1664800%2C+1880500%5D%2C%0D%0A+++++++++++++++++++++++++++%5B-1664900%2C+1880500%5D%5D%5D%2C%0D%0A++%22spatialReference%22+%3A+%7B%22wkid%22+%3A+102100%7D%0D%0A%7D&geometryType=esriGeometryPolygon&f=pgeojson'
        },
        'id': 'podor_Features_geojson',
        'type': 'fill',
        'layout': {},
        'paint': {
          'fill-color': '#088',
          'fill-opacity': 0.8
        }
      });
      //the following source causes the pbf data to load, but it doesnt show it on the map - the pbf format is not compatible with mapbox vector format MVT which is used in vector tiles
      // this.map.addLayer({
      //   'id': 'podor_Features_pbf',
      //   'type': 'fill',
      //   'source': {
      //     'type': 'vector',
      //     // return a single osm feature - geojson format
      //     'tiles': [
      //       'https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OpenStreetMap_Buildings_for_AFR/FeatureServer/0/query?where=osm_id2%3D%27832603018%27&f=pbf',
      //     ]
      //   },
      //   'source-layer': '',
      //   'layout': {},
      //   'paint': {
      //     'fill-color': '#800',
      //     'fill-opacity': 0.8
      //   }
      // });
    });
  }
  render() {
    return (
      <div className="App">
      <div id='map' style={{width:'100%',height:'100%',position:'absolute'}}></div>
    </div>
    );
  }
}

export default App;
