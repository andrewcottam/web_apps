/*global mapboxgl*/
import React from 'react';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  componentDidMount(){
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmxpc2h0ZW4iLCJhIjoiMEZrNzFqRSJ9.0QBRA2HxTb8YHErUFRMPZg';
    console.log(window.document.getElementById('map'))
    this.map = new mapboxgl.Map({
      container: window.document.getElementById('map'),
      style: 'mapbox://styles/mapbox/streets-v9'
    });
  }
  render(){
  return (
    <div className="App">
      <div id='map' style={{width:'100%',height:'100%',position:'absolute'}}></div>
    </div>
  );
}
}

export default App;
