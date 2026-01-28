import React, { useState } from 'react';
import Sidebar from './components/ui/Sidebar';
import MapaCementerio from './components/mapa/MapaCementerio';
import './index.css'; // Asegúrate de que los estilos globales estén limpios

function App() {
  const [nichoABuscar, setNichoABuscar] = useState(null);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null); // HU-GEO-07
  const [configuracionCapas, setConfiguracionCapas] = useState({
    'cementerio_general': true,
    'infraestructura': true,
    'bloques_geom': true,
    'nichos_geom': true
  });

  // Configuración de nombres amigables para el Sidebar
  const listaCapas = [
    { id: 'cementerio_general', nombre: 'Límites del Cementerio' },
    { id: 'infraestructura', nombre: 'Caminos y Edificios' },
    { id: 'bloques_geom', nombre: 'Bloques / Manzanas' },
    { id: 'nichos_geom', nombre: 'Nichos Individuales' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* 1. BARRA LATERAL IZQUIERDA */}
      <Sidebar 
        alBuscar={(codigo) => setNichoABuscar(codigo)}
        alCambiarCapas={(nuevasCapas) => setConfiguracionCapas(nuevasCapas)}
        alSeleccionarBloque={(bloque) => setBloqueSeleccionado(bloque)}
        capasConfig={listaCapas}
      />

      {/* 2. MAPA A LA DERECHA (Ocupa el resto) */}
      <MapaCementerio 
        nichoSeleccionado={nichoABuscar}
        bloqueSeleccionado={bloqueSeleccionado}
        capasVisiblesEstado={configuracionCapas}
      />

    </div>
  );
}

export default App;