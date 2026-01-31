import React, { useState } from 'react';
import Sidebar from './components/ui/Sidebar';
import MapaCementerio from './components/mapa/MapaCementerio';
import './App.css';

function App() {
  const [nichoABuscar, setNichoABuscar] = useState({ codigo: null, ts: 0 });
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [configuracionCapas, setConfiguracionCapas] = useState({
    'cementerio_general': true,
    'infraestructura': true,
    'bloques_geom': true,
    'nichos_geom': true
  });

  const [estadosVisibles, setEstadosVisibles] = useState(['disponible', 'ocupado', 'reservado']);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const listaCapas = [
    { id: 'cementerio_general', nombre: 'Límites del Cementerio' },
    { id: 'infraestructura', nombre: 'Caminos y Edificios' },
    { id: 'bloques_geom', nombre: 'Bloques / Manzanas' },
    { id: 'nichos_geom', nombre: 'Nichos Individuales' },
  ];

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="layout-principal">
      <button
        className="btn-hamburguesa"
        onClick={() => setMenuAbierto(true)}
      >
        ☰
      </button>

      <div
        className={`overlay-fondo ${menuAbierto ? 'activo' : ''}`}
        onClick={cerrarMenu}
      />

      <div className={`sidebar-wrapper ${menuAbierto ? 'abierto' : ''}`}>
        <button className="btn-cerrar" onClick={cerrarMenu}>✕</button>
        <Sidebar
          alBuscar={(codigo) => {
            setNichoABuscar({ codigo, ts: Date.now() });
            cerrarMenu();
          }}
          alCambiarCapas={setConfiguracionCapas}
          alSeleccionarBloque={(bloque) => { setBloqueSeleccionado(bloque); cerrarMenu(); }}
          capasConfig={listaCapas}
          className="sidebar-componente-interno"
          estadosSeleccionados={estadosVisibles}
          alCambiarEstados={setEstadosVisibles}
        />
      </div>

      <div className="mapa-wrapper">
        <MapaCementerio
          nichoSeleccionado={nichoABuscar}
          bloqueSeleccionado={bloqueSeleccionado}
          capasVisiblesEstado={configuracionCapas}
          estadosVisibles={estadosVisibles}
        />
      </div>
    </div>
  );
}

export default App;