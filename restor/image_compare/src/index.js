import React from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import CONSTANTS from './constants';
import jsonp from 'jsonp-promise';

mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';

class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: 5,
      lat: 34,
      zoom: 2,
      loading: false,
      currentSite: {},
    };
  }

  _get(params, timeout = CONSTANTS.TIMEOUT) {
    return new Promise((resolve, reject) => {
      //set the global loading flag
      this.setState({ loading: true });
      jsonp(CONSTANTS.PYTHON_REST_SERVER_ENDPOINT + params, { timeout: timeout }).promise.then((response) => {
        this.setState({ loading: false });
        resolve(response);
      }, (err) => {
        this.setState({ loading: false });
        reject(err);
      });
    });
  }

  _handleKeyDown(evt) {
    this.setState({ evaluation: evt.keyCode });
    this.currentSiteIndex = this.currentSiteIndex + 1;
    this.changeSite(this.state.sites[this.currentSiteIndex]);
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    this.map.on('move', () => {
      this.setState({
        lng: this.map.getCenter().lng.toFixed(4),
        lat: this.map.getCenter().lat.toFixed(4),
        zoom: this.map.getZoom().toFixed(2)
      });
    });

    this.map.on('style.load', (evt) => {
      this.map.addLayer({
        'id': 'planet_wmts_latest_biannual',
        'type': 'raster',
        'source': {
          type: 'raster',
          tiles: ['https://tiles.planet.com/basemaps/v1/latest-series/1725ab80-8e12-4b3c-9c25-99550eb466e4/gmap/{z}/{x}/{y}.png?api_key=361954dfdb954107a761d96cfcf8bab3'],
          tileSize: 256
        }
      });
    });

    //get the sites
    this._get("/services/get_sites?startfrom=1&buffersize=10000").then((response) => {
      this.currentSiteIndex = 0;
      this.setState({ sites: response.records }, _ => {
        this.changeSite(this.state.sites[0]);
      });
    });

    document.addEventListener("keydown", this._handleKeyDown.bind(this));
  }

  changeSite(site) {
    this.setState({ currentSite: site });
    var bbox = site.bbox.substr(4, site.bbox.length - 5).replace(/ /g, ",").split(",");
    this.map.fitBounds(bbox, { padding: { top: 10, bottom: 10, left: 10, right: 10 }, easing: (num) => { return 1; } });
  }

  onKeyPressed(obj) {
    console.log("wibble");
  }

  render() {
    return (
      <div>
      <div className='sidebarStyle'>
          <div>Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom: {this.state.zoom} | Eval: {this.state.evaluation}</div>
        </div>
        <div ref={el => this.mapContainer = el} className='mapContainer' />
      </div>
    );
  }
}

ReactDOM.render(<Application />, document.getElementById('app'));
