import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {CameraComponent, MediaPipeHand,} from './Camera.jsx'
import './main.css'

import ModelViwer from "./render3d.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
  <CameraComponent></CameraComponent>
  {/* <ModelViwer src="./src/assets/models3d/jesus.gltf" /> */}
  </>,
)
