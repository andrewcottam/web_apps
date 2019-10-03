import React from 'react';
import 'typeface-roboto';
import jsonp from 'jsonp-promise';
import './App.css';
import mapboxgl from 'mapbox-gl';
import InfoPanel from './InfoPanel.js';
import PopupPAList from './PopupPAList.js';

let WDPA_VERSIONS = [
  { name: 'wdpa_aug_2019_polygons', alias: 'August 2019', value: 'wdpa_aug_2019_polygons' },
  { name: 'wdpa_sep_2019_polygons', alias: 'September 2019', value: 'wdpa_sep_2019_polygons' },
];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({ baseVersion: {}, compareVersion: {}, paFeatures: [], popup_point: { x: 0, y: 0 } });
  }
  componentDidMount() {
    this.createMap();
  }
  //instantiates the mapboxgl map
  createMap() {
    mapboxgl.accessToken = "pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg";
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v9',
      zoom: 12,
      center: [-175.15, -21.15]
    });
    //add event handlers for the load and error events
    this.map.on("load", this.mapLoaded.bind(this));
    this.map.on("error", this.mapError.bind(this));
    this.map.on('style.load', (evt) => {
      this.setState({ baseVersion: WDPA_VERSIONS[0] }, () => {
        this.map.on('mouseenter', this.state.baseVersion.name, this.mouseEnterPA.bind(this));
        this.map.on('mouseleave', this.state.baseVersion.name, this.mouseLeavePA.bind(this, 2500));
        //add the wdpa first year
        this.addWDPASource(this.state.baseVersion);
        this.addWDPALayer(this.state.baseVersion);
      });
    });
  }

  getWDPADiff() {
    this._get("https://61c92e42cb1042699911c485c38d52ae.vfs.cloud9.eu-west-1.amazonaws.com/python-rest-server/pythonrestserver/services/get_wdpa_diff2?format=json").then(response => {
      this.setWDPAFilter(response.records);
    });
  }

  addMatchRule(expression, color, wdpaids){
    expression.push(wdpaids, color);
  }
  finalisePaintProperty(expression, layerName){
    // Last value is the default, used where the wdpa has not changed
    expression.push("rgba(150, 150, 150, 0)");  
    //set the paint property
    this.map.setPaintProperty(layerName, "fill-color", expression);
  }
  setWDPAFilter(records) {
    let baseExpression = ["match", ["get", "wdpaid"]];
    let compareExpression = ["match", ["get", "wdpaid"]];
    records.forEach((row, index) => {
      //get the status
      switch (row.note) {
        case 'new': 
          this.addMatchRule(compareExpression, "rgba(0,255,0,1)", row.wdpaids);
          break;
        case 'deleted': 
          this.addMatchRule(baseExpression, "rgba(255,0,0,1)", row.wdpaids);
          break;
        default:
          break;
      }
    });
    //finalise the paint properties and set them
    this.finalisePaintProperty(baseExpression, this.state.baseVersion.name);
    this.finalisePaintProperty(compareExpression, this.state.compareVersion.name);
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
  //adds the WDPA vector tile layer source - this is a separate function so that if the source vector tiles are updated, the layer can be re-added on its own
  addWDPASource(version) {
    //add the source for the wdpa
    let yr = version.alias.substr(-4); //get the year from the wdpa_version
    let attribution = "IUCN and UNEP-WCMC (" + yr + "), The World Database on Protected Areas (WDPA) " + version.alias + ", Cambridge, UK: UNEP-WCMC. Available at: <a href='http://www.protectedplanet.net'>www.protectedplanet.net</a>";
    let tiles = ["https://geospatial.jrc.ec.europa.eu/geoserver/gwc/service/wmts?layer=marxan:" + version.name + "&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=application/x-protobuf;type=mapbox-vector&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}"];
    this.setState({ wdpaAttribution: attribution });
    this.map.addSource(version.name, {
      "attribution": attribution,
      "type": "vector",
      "tiles": tiles
    });
  }

  //adds the WDPA vector tile layer - this is a separate function so that if the source vector tiles are updated, the layer can be re-added on its own
  addWDPALayer(version) {
    this.map.addLayer({
      "id": version.name,
      "type": "fill",
      "source": version.name,
      "source-layer": version.name,
      "layout": {
        "visibility": "visible"
      },
      "paint": {
        "fill-color": {
          "type": "categorical",
          "property": "marine",
          "stops": [
            ["0", "rgb(99,148,69)"],
            ["1", "rgb(63,127,191)"],
            ["2", "rgb(63,127,191)"]
          ]
        },
        "fill-outline-color": {
          "type": "categorical",
          "property": "marine",
          "stops": [
            ["0", "rgb(99,148,69)"],
            ["1", "rgb(63,127,191)"],
            ["2", "rgb(63,127,191)"]
          ]
        },
        "fill-opacity": 0.2
      }
    });
  }

  changeBaseYear(wdpa_version) {
    this.setState({ compareVersion: wdpa_version }, () => {
      this.addWDPASource(this.state.compareVersion);
      this.addWDPALayer(this.state.compareVersion);
      this.getWDPADiff();
    });
  }

  //makes a GET request and returns a promise which will either be resolved (passing the response) or rejected (passing the error)
  _get(url, params) {
    return new Promise((resolve, reject) => {
      //set the global loading flag
      jsonp(url).promise.then((response) => {
        resolve(response);
      }, (err) => {
        reject(err);
      });
    });
  }

  render() {
    return (
      <React.Fragment>
        <div ref={el => this.mapContainer = el} className="absolute top right left bottom" />
        <InfoPanel
          wdpa_versions={WDPA_VERSIONS}
          changeBaseYear={this.changeBaseYear.bind(this)}
        />
        <PopupPAList
          xy={this.state.popup_point}
          features={this.state.paFeatures}
          onMouseEnter={this.cancelTimer.bind(this)}
          onMouseLeave={this.startTimer.bind(this)}
        />
      </React.Fragment>
    );
  }
}

export default App;
