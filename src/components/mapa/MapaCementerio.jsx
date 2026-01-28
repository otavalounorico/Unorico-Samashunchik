import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, TileWMS, Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Style, Stroke, Fill, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { supabase } from '../../api/supabaseClient'; // HU-GEO-08: Para consultar datos del difunto

const MapaCementerio = ({ nichoSeleccionado, bloqueSeleccionado, capasVisiblesEstado }) => {
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const mapaRef = useRef(null);  // ← Referencia al mapa
  const capasRef = useRef({      // ← Referencia a las capas (persiste entre renders)
    cementerio_general: null,
    infraestructura: null,
    bloques_geom: null,
    nichos_geom: null
  });
  
  const [datosPopup, setDatosPopup] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState(null); // { tipo: 'exito' | 'error', codigo: string }
  const capaResaltadoRef = useRef(new VectorSource());
  const capaResaltadoBloqueRef = useRef(new VectorSource()); // HU-GEO-07: Capa para resaltar bloque
  const [etiquetaBloque, setEtiquetaBloque] = useState(null); // HU-GEO-07: Etiqueta del bloque seleccionado
  const [inicializado, setInicializado] = useState(false);

  // Función para obtener el extent del cementerio desde GeoServer
  const obtenerExtentCementerio = async () => {
    try {
      const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typename: 'otavalo_cementerio:cementerio_general',
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        maxFeatures: '1'
      });

      const respuesta = await fetch(`http://localhost:8080/geoserver/otavalo_cementerio/ows?${params.toString()}`);
      if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status}`);
      }

      const datosGeoJSON = await respuesta.json();
      const features = new GeoJSON().readFeatures(datosGeoJSON, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      if (features.length > 0) {
        const geometria = features[0].getGeometry();
        if (geometria) {
          return geometria.getExtent();
        }
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener extent del cementerio:', error);
    }
    return null;
  };

  // 1. INICIALIZACIÓN DEL MAPA (Solo ocurre una vez)
  useEffect(() => {
    // Si ya existe el mapa, no re-crear
    if (mapaRef.current) {
      return;
    }

    const inicializarMapa = async () => {
      // Primero obtenemos el extent del cementerio
      const extentCementerio = await obtenerExtentCementerio();
      
      // Crear las capas WMS
      const capaCementerio = new TileLayer({
        source: new TileWMS({
          url: 'http://localhost:8080/geoserver/wms',
          params: { 'LAYERS': 'otavalo_cementerio:cementerio_general', 'TILED': true, 'TRANSPARENT': true },
          serverType: 'geoserver',
        }),
        zIndex: 1,
        visible: true
      });

      const capaInfraestructura = new TileLayer({
        source: new TileWMS({
          url: 'http://localhost:8080/geoserver/wms',
          params: { 'LAYERS': 'otavalo_cementerio:infraestructura', 'TILED': true, 'TRANSPARENT': true },
          serverType: 'geoserver',
        }),
        zIndex: 2,
        visible: true
      });

      const capaBloques = new TileLayer({
        source: new TileWMS({
          url: 'http://localhost:8080/geoserver/wms',
          params: { 'LAYERS': 'otavalo_cementerio:bloques_geom', 'TILED': true, 'TRANSPARENT': true },
          serverType: 'geoserver',
        }),
        zIndex: 3,
        visible: true
      });

      const capaNichos = new TileLayer({
        source: new TileWMS({
          url: 'http://localhost:8080/geoserver/wms',
          params: { 'LAYERS': 'otavalo_cementerio:nichos_geom', 'TILED': true, 'TRANSPARENT': true },
          serverType: 'geoserver',
        }),
        zIndex: 4,
        visible: true
      });

      // Guardar referencias en el ref
      capasRef.current = {
        cementerio_general: capaCementerio,
        infraestructura: capaInfraestructura,
        bloques_geom: capaBloques,
        nichos_geom: capaNichos
      };

      // Capa de Resaltado - Color ROJO BRILLANTE para identificar fácilmente (HU-GEO-05 CA2)
      const capaVector = new VectorLayer({
        source: capaResaltadoRef.current,
        zIndex: 999,
        style: new Style({
          stroke: new Stroke({ color: '#FF0000', width: 5 }),  // Rojo brillante, borde grueso
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.35)' })   // Relleno rojo semi-transparente
        })
      });

      // Capa de Resaltado de Bloque - Color MORADO para filtro de bloques (HU-GEO-07)
      const capaVectorBloque = new VectorLayer({
        source: capaResaltadoBloqueRef.current,
        zIndex: 998,
        style: new Style({
          stroke: new Stroke({ color: '#8B5CF6', width: 2 }),  // Morado, borde más delgado
          fill: new Fill({ color: 'rgba(139, 92, 246, 0.15)' })
        })
      });

      // Overlay Popup
      const overlay = new Overlay({
        element: popupRef.current,
        autoPan: true,
        autoPanAnimation: { duration: 250 },
      });

      // Crear el mapa
      const nuevoMapa = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM(), zIndex: 0 }),
          capaCementerio,
          capaInfraestructura,
          capaBloques,
          capaNichos,
          capaVectorBloque,
          capaVector
        ],
        overlays: [overlay],
        view: new View({
          center: fromLonLat([-78.271892, -0.234494]),
          zoom: 18,
          minZoom: 16,
          maxZoom: 22,
        }),
      });

      // Guardar referencia al mapa
      mapaRef.current = nuevoMapa;

      // Si tenemos el extent, centramos inmediatamente sin animación
      if (extentCementerio) {
        nuevoMapa.getView().fit(extentCementerio, {
          padding: [50, 50, 50, 50],
          maxZoom: 19
        });
        console.log('✅ Mapa centrado en el cementerio');
      }

      // EVENTO CLICK - HU-GEO-08: Consulta de Información (Pop-up)
      nuevoMapa.on('singleclick', async (evt) => {
        const source = capasRef.current.nichos_geom?.getSource();
        if (!source) return;
        
        const url = source.getFeatureInfoUrl(
          evt.coordinate, 
          nuevoMapa.getView().getResolution(), 
          nuevoMapa.getView().getProjection(),
          { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 1 }
        );
        if (url) {
          const res = await fetch(url);
          const data = await res.json();
          if (data.features?.length > 0) {
            const propiedadesNicho = data.features[0].properties;
            
            // DEBUG: Ver qué campos devuelve GeoServer
            console.log('📋 Propiedades del nicho:', propiedadesNicho);
            
            // Obtener el ID del bloque desde el nicho
            const bloqueId = propiedadesNicho.bloques_geom_id || propiedadesNicho.bloque_id;
            
            // Consultar información del bloque y sector desde Supabase usando el ID
            if (bloqueId) {
              try {
                console.log('🔍 Buscando bloque con ID:', bloqueId);
                const { data: datosBloque, error } = await supabase
                  .from('bloques_geom')
                  .select('nombre, sector')
                  .eq('id', bloqueId)
                  .single();
                
                console.log('📦 Datos del bloque:', datosBloque, error);
                
                if (datosBloque) {
                  propiedadesNicho.bloque = datosBloque.nombre;
                  propiedadesNicho.sector = datosBloque.sector;
                }
              } catch (error) {
                console.warn('No se pudo obtener datos del bloque:', error);
              }
            }
            
            // CA1: Si está ocupado, consultar datos del difunto desde Supabase
            if (propiedadesNicho.estado === 'ocupado') {
              try {
                const { data: datosDifunto } = await supabase
                  .from('fallecido_nicho')
                  .select(`
                    fallecidos (
                      nombres,
                      apellidos,
                      fecha_defuncion,
                      responsable
                    )
                  `)
                  .eq('nicho_id', propiedadesNicho.id)
                  .limit(1)
                  .single();
                
                if (datosDifunto?.fallecidos) {
                  propiedadesNicho.difunto = {
                    nombre: `${datosDifunto.fallecidos.nombres} ${datosDifunto.fallecidos.apellidos}`,
                    fecha_defuncion: datosDifunto.fallecidos.fecha_defuncion,
                    responsable: datosDifunto.fallecidos.responsable
                  };
                }
              } catch (error) {
                console.warn('No se pudo obtener datos del difunto:', error);
              }
            }
            
            setDatosPopup(propiedadesNicho);
            overlay.setPosition(evt.coordinate);
          } else {
            overlay.setPosition(undefined);
          }
        }
      });

      setInicializado(true);
      setCargando(false);
      console.log('✅ Mapa inicializado correctamente');
    };

    inicializarMapa();
    
    // Cleanup: No destruimos el mapa para evitar problemas con StrictMode
    return () => {
      // Solo limpiamos si realmente se desmonta el componente
    };
  }, []);

  // 2. CONTROL DE VISIBILIDAD DE CAPAS
  useEffect(() => {
    if (!inicializado || !capasRef.current) return;
    
    const capas = capasRef.current;
    
    // Actualizar visibilidad de cada capa
    if (capas.cementerio_general) {
      capas.cementerio_general.setVisible(capasVisiblesEstado.cementerio_general);
    }
    if (capas.infraestructura) {
      capas.infraestructura.setVisible(capasVisiblesEstado.infraestructura);
    }
    if (capas.bloques_geom) {
      capas.bloques_geom.setVisible(capasVisiblesEstado.bloques_geom);
    }
    if (capas.nichos_geom) {
      capas.nichos_geom.setVisible(capasVisiblesEstado.nichos_geom);
    }
    
    console.log('🔄 Visibilidad actualizada:', capasVisiblesEstado);
  }, [capasVisiblesEstado, inicializado]);

  // 3. EFECTO: BUSCAR Y ZOOM AL NICHO (HU-GEO-05: Localización de Difuntos)
  useEffect(() => {
    if (!inicializado || !mapaRef.current || !nichoSeleccionado) return;

    const zoomAlNicho = async () => {
      const urlWFS = `http://localhost:8080/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:nichos_geom&outputFormat=application/json&CQL_FILTER=codigo='${nichoSeleccionado}'`;
      
      try {
        const res = await fetch(urlWFS);
        const data = await res.json();
        
        if (data.features?.length > 0) {
          const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
          
          // CA2: Resaltar nicho con borde de color diferente (rojo)
          capaResaltadoRef.current.clear();
          capaResaltadoRef.current.addFeatures(features);
          
          // CA1: Centrar la vista en el nicho encontrado
          mapaRef.current.getView().fit(features[0].getGeometry().getExtent(), { 
            duration: 1000, 
            maxZoom: 21, 
            padding: [100, 100, 100, 100] 
          });
          
          // Mostrar notificación de ÉXITO
          setNotificacion({ tipo: 'exito', codigo: nichoSeleccionado });
        } else {
          // Mostrar notificación de ERROR - No encontrado
          capaResaltadoRef.current.clear();
          setNotificacion({ tipo: 'error', codigo: nichoSeleccionado });
        }
        
        // Ocultar notificación después de 5 segundos
        setTimeout(() => setNotificacion(null), 5000);
        
      } catch (e) { 
        console.error("Error GeoServer", e);
        setNotificacion({ tipo: 'error', codigo: nichoSeleccionado });
        setTimeout(() => setNotificacion(null), 5000);
      }
    };
    zoomAlNicho();

  }, [nichoSeleccionado, inicializado]);

  // 4. EFECTO: ZOOM AL BLOQUE SELECCIONADO (HU-GEO-07: Filtrado Visual por Bloque)
  useEffect(() => {
    if (!inicializado || !mapaRef.current) return;
    
    // Si no hay bloque seleccionado, limpiar resaltado y etiqueta
    if (!bloqueSeleccionado) {
      capaResaltadoBloqueRef.current.clear();
      setEtiquetaBloque(null);
      return;
    }

    const zoomAlBloque = async () => {
      const urlWFS = `http://localhost:8080/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:bloques_geom&outputFormat=application/json&CQL_FILTER=codigo='${bloqueSeleccionado.codigo}'`;
      
      try {
        const res = await fetch(urlWFS);
        const data = await res.json();
        
        if (data.features?.length > 0) {
          const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
          
          // Resaltar el bloque seleccionado (borde morado)
          capaResaltadoBloqueRef.current.clear();
          capaResaltadoBloqueRef.current.addFeatures(features);
          
          // CA1: Hacer zoom para mostrar todo el bloque completo en pantalla
          mapaRef.current.getView().fit(features[0].getGeometry().getExtent(), { 
            duration: 800, 
            maxZoom: 20, 
            padding: [80, 80, 80, 80] 
          });
          
          // CA2: Mostrar etiqueta con el nombre del bloque
          setEtiquetaBloque(bloqueSeleccionado.nombre || bloqueSeleccionado.codigo);
          
          console.log('✅ Zoom al bloque:', bloqueSeleccionado.nombre);
        } else {
          capaResaltadoBloqueRef.current.clear();
          setEtiquetaBloque(null);
          console.warn('⚠️ Bloque no encontrado:', bloqueSeleccionado.codigo);
        }
        
      } catch (e) { 
        console.error("Error al obtener bloque desde GeoServer:", e);
        capaResaltadoBloqueRef.current.clear();
        setEtiquetaBloque(null);
      }
    };
    
    zoomAlBloque();

  }, [bloqueSeleccionado, inicializado]);

  return (
    <div style={{ flex: 1, position: 'relative', borderRadius: '0 20px 20px 0', overflow: 'hidden' }}>
      
      {/* ETIQUETA DE BLOQUE SELECCIONADO (HU-GEO-07 CA2) */}
      {etiquetaBloque && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #8B5CF6, #6366f1)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <span style={{ fontSize: '18px' }}>📍</span>
          <span>Bloque: {etiquetaBloque}</span>
        </div>
      )}
      
      {/* NOTIFICACIÓN DE BÚSQUEDA (HU-GEO-05) */}
      {notificacion && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: notificacion.tipo === 'exito' 
            ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '12px',
          boxShadow: notificacion.tipo === 'exito'
            ? '0 4px 20px rgba(34, 197, 94, 0.4)'
            : '0 4px 20px rgba(239, 68, 68, 0.4)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideDown 0.5s ease-out',
          fontSize: '15px',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '20px' }}>
            {notificacion.tipo === 'exito' ? '✅' : '❌'}
          </span>
          <span>
            {notificacion.tipo === 'exito' 
              ? <>Fallecido encontrado en nicho <strong>{notificacion.codigo}</strong></>
              : 'No se encontró ningún fallecido'
            }
          </span>
        </div>
      )}
      
      {/* PANTALLA DE CARGA */}
      {cargando && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: 'white'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>Cargando mapa...</p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>Ubicando cementerio</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes slideDown {
              0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
              100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}
      
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* POPUP DISEÑO PROFESIONAL MEJORADO */}
      <div ref={popupRef} style={{ 
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
        padding: '0', 
        borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)', 
        minWidth: '240px', 
        display: datosPopup ? 'block' : 'none',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header del popup */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '15px 20px',
          color: 'white',
          position: 'relative'
        }}>
          <button 
            onClick={() => {popupRef.current.style.display = 'none'; setDatosPopup(null)}} 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              border: 'none', 
              background: 'rgba(255,255,255,0.2)', 
              cursor: 'pointer', 
              fontSize: '16px',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >×</button>
          {datosPopup && (
            <h4 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📍 Nicho {datosPopup.codigo}
            </h4>
          )}
        </div>
        {/* Contenido del popup - HU-GEO-08 */}
        {datosPopup && (
          <div style={{ padding: '15px 20px' }}>
            {/* Estado del nicho */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '10px 12px',
              background: '#f1f5f9',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontWeight: '500', color: '#64748b', fontSize: '13px' }}>Estado:</span>
              <span style={{ 
                background: datosPopup.estado?.toLowerCase() === 'ocupado' 
                  ? 'linear-gradient(135deg, #ef4444, #f97316)' 
                  : datosPopup.estado?.toLowerCase() === 'disponible'
                    ? 'linear-gradient(135deg, #22c55e, #10b981)'
                    : 'linear-gradient(135deg, #f59e0b, #eab308)', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {datosPopup.estado}
              </span>
            </div>
            
            {/* Información de ubicación: Bloque y Sector - SIEMPRE visible */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ 
                padding: '8px 10px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Bloque</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{datosPopup.bloque || 'N/A'}</span>
              </div>
              <div style={{ 
                padding: '8px 10px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Sector</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{datosPopup.sector || 'N/A'}</span>
              </div>
            </div>
            
            {/* Información del Difunto y Responsable - SIEMPRE visible */}
            <div style={{ 
              background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '10px',
              padding: '12px',
              border: '1px solid #f59e0b'
            }}>
              <h5 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '12px', 
                color: '#92400e',
                textTransform: 'uppercase',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🕊️ Información del Difunto
              </h5>
              
              {/* Nombre del Difunto */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#a16207', display: 'block' }}>Difunto</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#78350f' }}>
                  {datosPopup.difunto?.nombre || 'N/A'}
                </span>
              </div>
              
              {/* Responsable */}
              <div>
                <span style={{ fontSize: '11px', color: '#a16207', display: 'block' }}>Responsable</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#78350f' }}>
                  {datosPopup.difunto?.responsable || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaCementerio;