import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App data={[{position: [0, 0, 12], normal: [0, 0, 0], color: [0, 255, 0]},{position: [1, 1, 12], normal: [0, 0, 0], color: [255, 0, 0]}]}/>
    {/* <App /> */}
  </React.StrictMode>,
)
