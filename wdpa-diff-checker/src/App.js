import React from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
let WDPA_LAYER_NAME = "wdpa"; //layer showing the protected areas from the WDPA

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({ paFeatures: [] });
  }
  componentDidMount(){
    this.createMap();
  }
  //instantiates the mapboxgl map
  createMap() {
    mapboxgl.accessToken = "pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg";
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v9',
      zoom: 12,
      center: [-175.1029, -21.2]
    });
    //add event handlers for the load and error events
    this.map.on("load", this.mapLoaded.bind(this));
    this.map.on("error", this.mapError.bind(this));
    this.map.on('mouseenter', WDPA_LAYER_NAME, this.mouseEnterPA.bind(this));
    this.map.on('mouseleave', WDPA_LAYER_NAME, this.mouseLeavePA.bind(this, 2500));
  }
  mouseEnterPA(e) {
    this.map.getCanvas().style.cursor = 'pointer';
    var coordinates = e.lngLat;
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    this.showProtectedAreasPopup(e.features, e);
  }

  mouseLeavePA(ms, e) {
    setTimeout(() => {
      if (!this.timerCancelled) {
        this.map.getCanvas().style.cursor = '';
        this.setState({ paFeatures: [] });
      }
    }, ms);
  }

  cancelTimer(e) {
    this.timerCancelled = true;
  }

  startTimer(e) {
    this.timerCancelled = false;
    this.mouseLeavePA(5);
  }

  //shows the list of protected areas that the user is mousing over
  showProtectedAreasPopup(features, e) {
    let paFeatures = [];
    let wdpaIds = [];
    features.forEach((feature) => {
      //to get unique protected areas
      if (wdpaIds.indexOf(feature.properties.wdpaid) < 0) {
        paFeatures.push(feature.properties);
        wdpaIds.push(feature.properties.wdpaid);
      }
    });
    this.setState({ paFeatures: paFeatures, popup_point: e.point });
  }

  mapLoaded(e) {
    this.map.addControl(new mapboxgl.ScaleControl());
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
  }

  //catch all event handler for map errors
  mapError(e) {
    console.error(e);
  }

  render() {
    return (
      <div ref={el => this.mapContainer = el} className="absolute top right left bottom" />
    );
  }
}

export default App;
