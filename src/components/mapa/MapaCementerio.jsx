import React, { useRef, useState, useEffect } from 'react';
import Overlay from 'ol/Overlay';
import { useMapContext } from '../../contexts/MapContext';

// Hooks
import { useMapa } from '../../hooks/map/useMapa';
import { useCapasMapa } from '../../hooks/map/useCapasMapa';
import { useResaltadoMapa } from '../../hooks/map/useResaltadoMapa';
import { useInteraccionesMapa } from '../../hooks/map/useInteraccionesMapa';
import { usePintadoMapa } from '../../hooks/map/usePintadoMapa';
import { useNavegacionMapa } from '../../hooks/map/useNavegacionMapa';

// Components
import NichePopup from './components/PopupNicho';
import BlockLabel from './components/EtiquetaBloque';
import MapRotationControls from './components/ControlesRotacion';

import './MapaCementerio.css';

const MapaCementerio = ({
  nichoSeleccionado,
  bloqueSeleccionado,
  sectorSeleccionado,
  capasVisiblesEstado,
  estadosVisibles,
  alDeseleccionarNicho,
  alDeseleccionarBloque
}) => {

  // 1. Refs & Context
  const mapElement = useRef(null);
  const popupRef = useRef(null);
  const blockLabelRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const labelOverlayRef = useRef(null);

  const mapContext = useMapContext();
  const setSelectedBloque = mapContext?.setSelectedBloque ?? null;

  // 2. States
  const [datosPopup, setDatosPopup] = useState(null);
  const [etiquetaBloque, setEtiquetaBloque] = useState(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null); // { tipo: 'success'|'error'|'info', texto: '' }

  // Helper para notificaciones con auto-ocultado
  const mostrarNotificacion = (mensaje) => {
    setMensajeNotificacion(mensaje);
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 5000);
  };

  // 3. Init Map
  const { map, isInitialized } = useMapa(mapElement);

  // 4. Init Layers & Highlights
  const layers = useCapasMapa(map, isInitialized, capasVisiblesEstado);
  const sources = useResaltadoMapa(map, isInitialized);

  // 5. Setup Overlays
  useEffect(() => {
    if (!map || !popupRef.current || !blockLabelRef.current) return;

    // Create overlays only once
    if (!popupOverlayRef.current) {
      popupOverlayRef.current = new Overlay({
        element: popupRef.current,
        autoPan: false,
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -10]
      });
      map.addOverlay(popupOverlayRef.current);
    }

    if (!labelOverlayRef.current) {
      labelOverlayRef.current = new Overlay({
        element: blockLabelRef.current,
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -18]
      });
      map.addOverlay(labelOverlayRef.current);
    }

    return () => {
      // Cleanup handled by map removal mainly
    };
  }, [map]);

  // 6. Map Logic Hooks

  // Painting (Coloring)
  usePintadoMapa(map, isInitialized, estadosVisibles, sources.estados, layers.nichos_geom);

  // Interactions (Clicks)
  useInteraccionesMapa({
    map,
    isInitialized,
    layerNichos: layers.nichos_geom,
    sourceResaltado: sources.resaltado,
    onNichoSelected: ({ data, coordinate }) => {
      setDatosPopup(data);
      popupOverlayRef.current?.setPosition(coordinate);
    },
    onDeselected: () => {
      setDatosPopup(null);
      popupOverlayRef.current?.setPosition(undefined);
      if (alDeseleccionarNicho) alDeseleccionarNicho();
    }
  });

  // Navigation (Zoom to props)
  useNavegacionMapa({
    map,
    isInitialized,
    nichoSeleccionado,
    bloqueSeleccionado,
    sectorSeleccionado,
    sourceResaltado: sources.resaltado,
    sourceBloque: sources.bloque,
    sourceSector: sources.sector,
    onUpdatePopup: setDatosPopup,
    onUpdateBlockLabel: setEtiquetaBloque,
    onShowNotification: mostrarNotificacion,
    popupOverlay: popupOverlayRef.current,
    labelOverlay: labelOverlayRef.current
  });

  // UI Handlers
  const cerrarNichoPopup = () => {
    setDatosPopup(null);
    popupOverlayRef.current?.setPosition(undefined);
    sources.resaltado.clear();
    if (alDeseleccionarNicho) alDeseleccionarNicho();
  };

  const cerrarBloque = () => {
    sources.bloque.clear();
    setEtiquetaBloque(null);
    setDatosPopup(null);
    popupOverlayRef.current?.setPosition(undefined);
    labelOverlayRef.current?.setPosition(undefined);

    if (typeof setSelectedBloque === 'function') setSelectedBloque(null);
    if (typeof alDeseleccionarBloque === 'function') alDeseleccionarBloque();
    try { window.dispatchEvent(new CustomEvent('deseleccionarBloque')); } catch (e) { }
  };

  const handleRotateLeft = () => {
    if (map) {
      const view = map.getView();
      view.animate({ rotation: view.getRotation() - Math.PI / 4, duration: 300 });
    }
  };

  const handleRotateRight = () => {
    if (map) {
      const view = map.getView();
      view.animate({ rotation: view.getRotation() + Math.PI / 4, duration: 300 });
    }
  };

  return (
    <div className="mapa-cementerio-container">
      {/* Notificaciones */}
      {mensajeNotificacion && (
        <div className={`map-notification ${mensajeNotificacion.tipo === 'error' ? 'notif-error' : 'notif-success'}`}>
          <span>{mensajeNotificacion.texto}</span>
        </div>
      )}

      {/* Elementos DOM para Overlays */}
      <div style={{ display: etiquetaBloque ? 'block' : 'none' }}>
        <div ref={blockLabelRef}>
          <BlockLabel etiqueta={etiquetaBloque} onClose={cerrarBloque} />
        </div>
      </div>

      <div style={{ display: datosPopup ? 'block' : 'none' }}>
        <div ref={popupRef}>
          <NichePopup datos={datosPopup} onClose={cerrarNichoPopup} />
        </div>
      </div>

      <MapRotationControls
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
      />

      {!isInitialized && <div className="map-loader"><div className="spinner" /><p>Cargando mapa...</p></div>}

      <div ref={mapElement} className="mapa-cementerio-mapa" />
    </div>
  );
};

export default MapaCementerio;