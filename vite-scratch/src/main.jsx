import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App data={[{position: [-122.4, 37.7, 12], normal: [-1, 0, 0], color: [255, 255, 0]}]}/>
    {/* <App /> */}
  </React.StrictMode>,
)
