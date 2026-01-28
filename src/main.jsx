import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Nota: Se quitó StrictMode porque OpenLayers no es compatible
// con la doble ejecución de efectos que hace StrictMode en desarrollo
createRoot(document.getElementById('root')).render(
  <App />
)
