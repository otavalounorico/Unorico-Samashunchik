import React, { useRef, useState, useEffect } from 'react';
import 'ol/ol.css';
import Overlay from 'ol/Overlay';
import { supabase } from '../../api/supabaseClient';
import { GeoJSON } from 'ol/format';
import { fromLonLat } from 'ol/proj';
import './MapaCementerio.css';

// --- CONFIGURACIÓN DEL SERVIDOR ---
// Si reinicias el túnel, SOLO CAMBIA ESTA LÍNEA con el nuevo enlace:
const GEOSERVER_URL = 'http://localhost:8080/geoserver/otavalo_cementerio';

const MapaCementerio = ({ nichoSeleccionado, bloqueSeleccionado, sectorSeleccionado, capasVisiblesEstado, estadosVisibles, alDeseleccionarNicho }) => {

  // 1. REFS Y ESTADOS
  const mapElement = useRef(null);
  const mapaRef = useRef(null);
  const popupRef = useRef(null);
  const overlayRef = useRef(null);

  const capasRef = useRef({
    cementerio_general: null,
    infraestructura: null,
    bloques_geom: null,
    nichos_geom: null
  });

  const capaResaltadoRef = useRef(null);
  const capaResaltadoBloqueRef = useRef(null);
  const capaResaltadoSectorRef = useRef(null);
  const capaResaltadoEstadosRef = useRef(null);

  const [datosPopup, setDatosPopup] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [etiquetaBloque, setEtiquetaBloque] = useState(null);
  const [inicializado, setInicializado] = useState(false);
  // modoSatelite eliminado

  // --- FUNCIÓN AUXILIAR: Obtener Extent ---


  // --- FUNCIÓN AUXILIAR DE DATOS (REUTILIZABLE) ---
  const obtenerDatosCompletoNicho = async (props) => {
    // Normalizar código (Geoserver a veces devuelve CODIGO en mayúsculas)
    let codigoRaw = props.codigo || props.CODIGO || props.Codigo;
    if (codigoRaw && typeof codigoRaw === 'string') {
      codigoRaw = codigoRaw.trim();
    }

    console.log("Obteniendo datos para:", codigoRaw);

    const datosFinales = { ...props, codigo: codigoRaw }; // Aseguramos que 'codigo' exista en el objeto final

    let bloqueEncontrado = false;

    // 1. Primero intentar obtener datos ADMINISTRATIVOS (prioridad)
    if (codigoRaw) {
      const { data: dbNicho, error: errDb } = await supabase
        .from('nichos')
        .select('bloques(nombre, codigo, bloques_geom(sector))')
        .eq('codigo', codigoRaw)
        .maybeSingle();

      if (errDb) console.error("Error buscando nicho admin:", errDb);

      if (dbNicho && dbNicho.bloques) {
        datosFinales.bloque = `${dbNicho.bloques.nombre} (${dbNicho.bloques.codigo || 'S/C'})`;
        if (dbNicho.bloques.bloques_geom) {
          datosFinales.sector = dbNicho.bloques.bloques_geom.sector;
        }
        bloqueEncontrado = true;
      }
    }

    // 2. Geometría (Fallback de ubicación)
    if (codigoRaw) {
      const { data: nichoGeom, error: errGeom } = await supabase
        .from('nichos_geom')
        .select('bloques_geom_id, estado') // Traemos estado de geom también por si acaso
        .eq('codigo', codigoRaw)
        .maybeSingle();

      if (errGeom) console.error("Error buscando nicho geom:", errGeom);

      if (nichoGeom) {
        // Si no encontramos bloque en admin, usamos geom
        if (nichoGeom.bloques_geom_id && !bloqueEncontrado) {
          const { data: bGeom } = await supabase
            .from('bloques_geom')
            .select('nombre, sector, codigo')
            .eq('id', nichoGeom.bloques_geom_id)
            .maybeSingle();

          if (bGeom) {
            datosFinales.bloque = `${bGeom.nombre} (${bGeom.codigo})`;
            datosFinales.sector = bGeom.sector;
            bloqueEncontrado = true;
          }
        }
        // Si no tenemos estado aun (porque no existia en props), usamos el de geom temporalmente
        if (!datosFinales.estado && nichoGeom.estado) {
          datosFinales.estado = nichoGeom.estado;
        }
      }
    }

    // 3. Estado Administrativo (Sobrescribe geometria si existe)
    if (codigoRaw) {
      const { data: estadoData, error: errEst } = await supabase
        .from('nichos')
        .select('estado')
        .eq('codigo', codigoRaw)
        .maybeSingle();

      if (errEst) console.error("Error buscando estado admin:", errEst);

      if (estadoData && estadoData.estado) {
        datosFinales.estado = estadoData.estado;
      }
    }

    // 4. Difuntos
    let datosDifuntoFinal = null;
    if (codigoRaw) {
      let { data: nAdmin, error: errN } = await supabase.from('nichos').select('id').eq('codigo', codigoRaw).maybeSingle();
      if (errN) console.error("Error buscando ID nicho:", errN);

      if (!nAdmin) {
        console.log("No encontrado exacto, probando ilike para:", codigoRaw);
        const { data: nLike } = await supabase.from('nichos').select('id').ilike('codigo', codigoRaw).limit(1);
        if (nLike && nLike.length > 0) nAdmin = nLike[0];
      }

      if (nAdmin) {
        console.log("Nicho Admin ID encontrado:", nAdmin.id);
        const { data: rel, error: errRel } = await supabase
          .from('fallecido_nicho')
          .select(`fallecidos (nombres, apellidos, fecha_fallecimiento), socios (nombres, apellidos)`)
          .eq('nicho_id', nAdmin.id)
          .is('fecha_exhumacion', null)
          .order('created_at', { ascending: false });

        if (errRel) console.error("Error buscando difuntos:", errRel);

        if (rel && rel.length > 0) {
          datosDifuntoFinal = rel;
          console.log("Difuntos encontrados:", rel.length);
        } else {
          console.log("Sin difuntos activos.");
        }
      } else {
        console.log("Nicho Admin NO encontrado para difuntos.");
      }
    }

    if (datosDifuntoFinal && Array.isArray(datosDifuntoFinal)) {
      datosFinales.difuntos = datosDifuntoFinal.map(d => {
        const nombreResponsable = d.socios
          ? `${d.socios.nombres} ${d.socios.apellidos}`
          : 'No definido';

        return {
          nombre: `${d.fallecidos.nombres} ${d.fallecidos.apellidos}`,
          responsable: nombreResponsable
        };
      });
    } else {
      datosFinales.difuntos = [];
    }

    // Asegurar que si estado es DISPONIBLE, se muestre así
    if (!datosFinales.estado) {
      datosFinales.estado = 'DESCONOCIDO';
    }

    return datosFinales;
  };

  const cerrarNichoPopup = () => {
    setDatosPopup(null);
    if (overlayRef.current) overlayRef.current.setPosition(undefined);
    if (capaResaltadoRef.current) capaResaltadoRef.current.clear();
    if (alDeseleccionarNicho) alDeseleccionarNicho();
  };

  // --- 1. INICIALIZACIÓN DEL MAPA ---
  useEffect(() => {
    if (mapaRef.current) return;

    const inicializarMapa = async () => {
      const Map = (await import('ol/Map')).default;
      const View = (await import('ol/View')).default;
      const TileLayer = (await import('ol/layer/Tile')).default;
      const VectorLayer = (await import('ol/layer/Vector')).default;
      const TileWMS = (await import('ol/source/TileWMS')).default;
      const VectorSource = (await import('ol/source/Vector')).default;
      const OSM = (await import('ol/source/OSM')).default;
      // XYZ eliminado
      const { Style, Stroke, Fill } = await import('ol/style');

      capaResaltadoRef.current = new VectorSource();
      capaResaltadoBloqueRef.current = new VectorSource();
      capaResaltadoSectorRef.current = new VectorSource();
      capaResaltadoEstadosRef.current = new VectorSource();



      // CAPAS BASE
      // Solo OSM
      const capaOSM = new TileLayer({ source: new OSM(), zIndex: 0, visible: true });

      // SE ELIMINÓ CAPA SATELITE


      // CAPAS WMS (todas usan GEOSERVER_URL)
      // Ajuste: Cargar cementerio_general como WMS
      const capaCementerio = new TileLayer({
        source: new TileWMS({
          url: `${GEOSERVER_URL}/wms`,
          params: { 'LAYERS': 'otavalo_cementerio:cementerio_general', 'TILED': true, 'TRANSPARENT': true },
          serverType: 'geoserver'
        }),
        zIndex: 1, visible: true
      });
      const capaInfraestructura = new TileLayer({
        source: new TileWMS({ url: `${GEOSERVER_URL}/wms`, params: { 'LAYERS': 'otavalo_cementerio:infraestructura', 'TILED': true, 'TRANSPARENT': true }, serverType: 'geoserver' }),
        zIndex: 2, visible: true
      });
      const capaBloques = new TileLayer({
        source: new TileWMS({ url: `${GEOSERVER_URL}/wms`, params: { 'LAYERS': 'otavalo_cementerio:bloques_geom', 'TILED': true, 'TRANSPARENT': true }, serverType: 'geoserver' }),
        zIndex: 3, visible: true
      });
      const capaNichos = new TileLayer({
        source: new TileWMS({ url: `${GEOSERVER_URL}/wms`, params: { 'LAYERS': 'otavalo_cementerio:nichos_geom', 'TILED': true, 'TRANSPARENT': true }, serverType: 'geoserver' }),
        zIndex: 4, visible: true
      });

      Object.assign(capasRef.current, {
        cementerio_general: capaCementerio,
        infraestructura: capaInfraestructura,
        bloques_geom: capaBloques,
        nichos_geom: capaNichos
      });

      const capaVector = new VectorLayer({
        source: capaResaltadoRef.current, zIndex: 999,
        style: new Style({ stroke: new Stroke({ color: '#ef4444', width: 4 }), fill: new Fill({ color: 'rgba(239, 68, 68, 0.2)' }) })
      });
      const capaVectorBloque = new VectorLayer({
        source: capaResaltadoBloqueRef.current, zIndex: 998,
        style: new Style({ stroke: new Stroke({ color: '#8B5CF6', width: 2 }), fill: new Fill({ color: 'rgba(139, 92, 246, 0.15)' }) })
      });
      const capaVectorSector = new VectorLayer({
        source: capaResaltadoSectorRef.current, zIndex: 997,
        style: new Style({ stroke: new Stroke({ color: '#8B5CF6', width: 2.5 }), fill: new Fill({ color: 'rgba(139, 92, 246, 0.12)' }) })
      });

      const capaVectorEstados = new VectorLayer({
        source: capaResaltadoEstadosRef.current, zIndex: 990,
        style: (feature) => {
          const est = (feature.get('estado') || feature.get('ESTADO') || feature.get('Estado') || '').toLowerCase();
          const colors = {
            ocupado: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.7)' },
            disponible: { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.7)' },
            mantenimiento: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.7)' },
            reservado: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.7)' },
            malas: { stroke: '#991b1b', fill: 'rgba(153, 27, 27, 0.8)' }, // Rojo oscuro para malas
            malo: { stroke: '#991b1b', fill: 'rgba(153, 27, 27, 0.8)' }
          };
          const c = colors[est] || { stroke: '#94a3b8', fill: 'rgba(148, 163, 184, 0.2)' };
          return new Style({
            stroke: new Stroke({ color: c.stroke, width: 2 }),
            fill: new Fill({ color: c.fill })
          });
        }
      });

      const overlay = new Overlay({
        element: popupRef.current,
        autoPan: false,
        positioning: 'bottom-center', stopEvent: false, offset: [0, -10]
      });
      overlayRef.current = overlay;

      const { defaults: defaultControls } = await import('ol/control');

      const nuevoMapa = new Map({
        target: mapElement.current,
        layers: [capaOSM, capaCementerio, capaInfraestructura, capaBloques, capaNichos, capaVectorEstados, capaVectorSector, capaVectorBloque, capaVector],
        overlays: [overlay],
        controls: defaultControls({
          rotateOptions: { autoHide: false, tipLabel: 'Restablecer Norte' }
        }),
        view: new View({
          center: fromLonLat([-78.26549, 0.21908]), // Coordenadas exactas Cementerio Otavalo
          zoom: 19,
          minZoom: 16,
          maxZoom: 22,
          rotation: 0.34 // Ajuste fino a la izquierda
        }),
      });
      mapaRef.current = nuevoMapa;


      // SE ELIMINÓ: Ajuste automático al extent que causaba error "Cannot fit empty extent"
      // debido a problemas con la proyección de la capa cementerio_general en Geoserver.
      // Ya estamos centrando manualmente en las coordenadas correctas.

      nuevoMapa.on('singleclick', async (evt) => {
        console.log("--- CLICK EN MAPA ---");
        setDatosPopup(null);
        if (overlayRef.current) overlayRef.current.setPosition(undefined);

        const source = capasRef.current.nichos_geom?.getSource();
        if (!source) {
          console.warn("Source nichos_geom no disponible");
          return;
        }

        const view = nuevoMapa.getView();
        const url = source.getFeatureInfoUrl(
          evt.coordinate,
          view.getResolution(),
          view.getProjection(),
          { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 1 }
        );

        if (url) {
          console.log("URL WFS generada:", url);
          try {
            // CORREGIDO: Evitar duplicar el path si ya es correcto
            let urlSegura = url;

            // Si la URL generada por OL ya empieza con nuestra GEOSERVER_URL, no hacemos nada.
            // Esto evita el error de duplicar el workspace (otavalo_cementerio/otavalo_cementerio)
            if (!url.startsWith(GEOSERVER_URL)) {
              urlSegura = url.replace(/http:\/\/localhost:8080\/geoserver/gi, GEOSERVER_URL);
            }

            console.log("URL WFS segura:", urlSegura);

            const res = await fetch(urlSegura);
            if (!res.ok) {
              console.error("Error validando fetch:", res.status, res.statusText);
              return;
            }

            const data = await res.json();
            console.log("Data recibida WFS:", data);

            if (data.features && data.features.length > 0) {
              const feature = new GeoJSON().readFeature(data.features[0]);
              capaResaltadoRef.current.clear();
              capaResaltadoRef.current.addFeature(feature);

              const props = data.features[0].properties;
              console.log("Propiedades Feature:", props);

              const datosFinales = await obtenerDatosCompletoNicho(props);
              console.log("Datos Finales para Popup:", datosFinales);

              setDatosPopup(datosFinales);
              if (overlayRef.current) {
                overlayRef.current.setPosition(evt.coordinate);
                console.log("Popup posicionado en:", evt.coordinate);
              }

              // AGREGADO: Zoom suave
              const currentZoom = view.getZoom();
              if (currentZoom < 22) {
                view.animate({
                  zoom: currentZoom + 1,
                  duration: 300,
                  anchor: evt.coordinate
                });
              }

            } else {
              console.log("No features found at click location");
              capaResaltadoRef.current.clear();
            }
          } catch (e) {
            console.error("Error en singleclick:", e);
          }
        } else {
          console.log("No se generó URL WFS");
        }
      });

      setInicializado(true);
      setCargando(false);
    };

    inicializarMapa();
    return () => {
      if (mapaRef.current) { mapaRef.current.setTarget(null); mapaRef.current = null; }
    };
  }, []);

  // --- EFECTOS AUXILIARES ---
  useEffect(() => {
    if (!inicializado || !capasRef.current) return;
    const c = capasRef.current;
    if (c.cementerio_general) c.cementerio_general.setVisible(capasVisiblesEstado.cementerio_general);
    if (c.infraestructura) c.infraestructura.setVisible(capasVisiblesEstado.infraestructura);
    if (c.bloques_geom) c.bloques_geom.setVisible(capasVisiblesEstado.bloques_geom);
    if (c.nichos_geom) c.nichos_geom.setVisible(capasVisiblesEstado.nichos_geom);
  }, [capasVisiblesEstado, inicializado]);

  // EFECTO CAMBIO MAPA BASE ELIMINADO

  // EFECTO DE MARCADO
  useEffect(() => {
    if (!inicializado || !capasRef.current.nichos_geom || !capaResaltadoEstadosRef.current) return;

    capasRef.current.nichos_geom.getSource().updateParams({ 'CQL_FILTER': undefined });
    capaResaltadoEstadosRef.current.clear();

    if (!estadosVisibles || estadosVisibles.length === 0) return;

    const actualizarPintado = async () => {
      // Limpiamos siempre al inicio
      capaResaltadoEstadosRef.current.clear();

      if (!mapaRef.current || !estadosVisibles.length) {
        return;
      }

      const especificos = ['Estado_Bueno', 'Estado_Malo', 'Mantenimiento'];
      const hayEspecificos = estadosVisibles.some(e => especificos.includes(e));
      const verLibres = estadosVisibles.includes('Disponible');

      // Si SOLO está 'Ocupado' y nada más, no mostramos nada aún (pedido del usuario)
      if (estadosVisibles.length === 1 && estadosVisibles.includes('Ocupado')) {
        return;
      }

      try {
        let promesas = [];

        // 1. QUERY A TBL NICHOS (Para Ocupados y Mantenimiento)
        if (hayEspecificos) {
          let filtrosOR = [];

          if (estadosVisibles.includes('Estado_Bueno')) {
            filtrosOR.push(`estado.ilike.ocupado`);
          }
          if (estadosVisibles.includes('Estado_Malo')) {
            if (!filtrosOR.includes(`estado.ilike.ocupado`)) {
              filtrosOR.push(`estado.ilike.ocupado`);
            }
          }
          if (estadosVisibles.includes('Mantenimiento')) {
            filtrosOR.push(`estado.ilike.mantenimiento`);
          }

          if (filtrosOR.length > 0) {
            const queryOR = filtrosOR.join(',');
            const pNichos = supabase
              .from('nichos')
              .select('codigo, estado, disponible, socio_id')
              .or(queryOR)
              .range(0, 19999);
            promesas.push(pNichos);
          } else {
            promesas.push(Promise.resolve({ data: [] }));
          }
        } else {
          promesas.push(Promise.resolve({ data: [] }));
        }

        // 2. QUERY A TBL NICHOS_GEOM (Para Libres / Disponibles)
        if (verLibres) {
          const pLibres = supabase
            .from('nichos_geom')
            .select('codigo, estado')
            .ilike('estado', 'DISPONIBLE')
            .range(0, 19999);
          promesas.push(pLibres);
        } else {
          promesas.push(Promise.resolve({ data: [] }));
        }

        const resultados = await Promise.all(promesas);
        const resNichos = resultados[0]; // Admin
        const resGeom = resultados[1];   // Geom

        let listaFinal = [];

        // Procesar Ocupados/Mantenimiento
        if (resNichos.data) {
          const filtradosAdmin = resNichos.data.filter(n => {
            if (estadosVisibles.includes('Mantenimiento') && n.estado?.toLowerCase() === 'mantenimiento') return true;
            if (estadosVisibles.includes('Estado_Bueno') &&
              n.estado?.toLowerCase() === 'ocupado' && n.disponible === true) return true;
            if (estadosVisibles.includes('Estado_Malo') &&
              n.estado?.toLowerCase() === 'ocupado' && n.disponible === false) return true;
            return false;
          });
          listaFinal = [...listaFinal, ...filtradosAdmin];
        }

        // Procesar Libres
        if (resGeom.data) {
          const libresFormateados = resGeom.data.map(g => ({
            codigo: g.codigo,
            estado: 'DISPONIBLE',
            disponible: true,
            socio_id: null
          }));
          listaFinal = [...listaFinal, ...libresFormateados];
        }

        if (listaFinal.length === 0) {
          return;
        }

        // SEPARAR CÓDIGOS PARA ESTRATEGIA HÍBRIDA
        // 1. Libres/Disponibles -> Bulk Fetch
        // 2. Ocupados/Mantenimiento -> Chunk Fetch

        const codigosLibres = listaFinal
          .filter(n => n.estado === 'DISPONIBLE')
          .map(n => n.codigo);

        const codigosResto = listaFinal
          .filter(n => n.estado !== 'DISPONIBLE')
          .map(n => n.codigo);

        const codigosRestoUnicos = [...new Set(codigosResto)];

        const procesarFeatures = (features) => {
          features.forEach(f => {
            const codigoF = f.get('codigo') || f.get('CODIGO');
            const d = listaFinal.find(n => n.codigo === codigoF);
            if (d) {
              let colorKey = '';
              // Reglas estrictas
              if (d.estado === 'DISPONIBLE') {
                colorKey = 'disponible';
              } else if (d.estado?.toLowerCase() === 'mantenimiento') {
                colorKey = 'mantenimiento';
              } else if (d.estado?.toLowerCase() === 'ocupado') {
                colorKey = d.disponible ? 'ocupado' : 'malas';
              }
              if (colorKey) f.set('estado', colorKey);
            }
          });
          capaResaltadoEstadosRef.current.addFeatures(features);
        };

        // ESTRATEGIA 1: BULK FETCH PARA DISPONIBLES
        // Pedimos TODOS los disponibles de una vez usando CQL_FILTER=estado='DISPONIBLE'
        // Esto es mucho más rápido que pedir miles de IDs
        if (codigosLibres.length > 0) {
          const urlBulk = `${GEOSERVER_URL}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:nichos_geom&outputFormat=application/json&CQL_FILTER=estado='DISPONIBLE'&maxFeatures=20000`;

          fetch(urlBulk)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.features) {
                const features = new GeoJSON().readFeatures(data, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
                // ESTRATEGIA: Filtrar contra la lista de Ocupados/Mantenimiento (codigosResto)
                // Si un nicho está en 'nichos_geom' como DISPONIBLE pero en 'nichos' como OCUPADO,
                // GeoServer lo traerá aquí. Debemos evitar pintarlo verde para que luego se pinte rojo/amarillo.
                const featuresVerdes = features.filter(f => {
                  const c = f.get('codigo') || f.get('CODIGO');
                  return !codigosResto.includes(c);
                });

                featuresVerdes.forEach(f => f.set('estado', 'disponible'));

                capaResaltadoEstadosRef.current.addFeatures(featuresVerdes);
              }
            })
            .catch(e => console.error("Error Bulk WFS:", e));
        }

        // ESTRATEGIA 2: CHUNK FETCH PARA EL RESTO (Ocupados, Mantenimiento)
        if (codigosRestoUnicos.length > 0) {
          const CHUNK_SIZE = 50;
          const chunks = [];
          for (let i = 0; i < codigosRestoUnicos.length; i += CHUNK_SIZE) {
            chunks.push(codigosRestoUnicos.slice(i, i + CHUNK_SIZE));
          }

          const procesarChunk = async (chunk) => {
            const safeChunk = chunk.map(c => `'${c.replace(/'/g, "''")}'`);
            const filter = `codigo IN (${safeChunk.join(',')})`;
            const url = `${GEOSERVER_URL}/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:nichos_geom&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(filter)}`;

            try {
              const res = await fetch(url);
              if (!res.ok) return;
              const data = await res.json();
              if (data.features) {
                const features = new GeoJSON().readFeatures(data, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
                procesarFeatures(features); // Ya vienen filtrados por ID
              }
            } catch (e) {
              console.error("Error fetch WFS chunk:", e);
            }
          };

          const CONCURRENCY = 5;
          for (let i = 0; i < chunks.length; i += CONCURRENCY) {
            const batch = chunks.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(chunk => procesarChunk(chunk)));
          }
        }
      } catch (e) {
        console.error("Error pintado:", e);
      }
    };

    actualizarPintado();
  }, [estadosVisibles, inicializado]);

  // ZOOM Y BUSQUEDA
  useEffect(() => {
    const nichoCodigo = nichoSeleccionado?.codigo;
    if (!inicializado || !mapaRef.current || !nichoCodigo) return;

    const doZoom = async () => {
      // CORREGIDO: URL segura
      const url = `${GEOSERVER_URL}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:nichos_geom&outputFormat=application/json&CQL_FILTER=codigo='${nichoCodigo}'`;
      try {
        const r = await fetch(url);
        const d = await r.json();
        if (d.features?.length) {
          const f = new GeoJSON().readFeatures(d, { featureProjection: 'EPSG:3857' });
          capaResaltadoRef.current.clear();
          capaResaltadoRef.current.addFeatures(f);
          mapaRef.current.getView().fit(f[0].getGeometry().getExtent(), { duration: 1000, maxZoom: 21, padding: [100, 100, 100, 100] });
          const props = f[0].getProperties();
          const datosCompletos = await obtenerDatosCompletoNicho(props);
          setDatosPopup(datosCompletos);
          const extent = f[0].getGeometry().getExtent();
          overlayRef.current?.setPosition([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
        }
      } catch (e) { }
    };
    doZoom();
  }, [nichoSeleccionado?.ts, inicializado]);

  // EFECTO SECTOR
  useEffect(() => {
    if (!inicializado || !mapaRef.current) return;

    if (!sectorSeleccionado) {
      capaResaltadoSectorRef.current?.clear();
      return;
    }

    const doZoomSector = async () => {
      // CORREGIDO: URL segura
      const url = `${GEOSERVER_URL}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:bloques_geom&outputFormat=application/json&CQL_FILTER=sector='${sectorSeleccionado}'`;

      try {
        const r = await fetch(url);
        const d = await r.json();

        if (d.features?.length) {
          const features = new GeoJSON().readFeatures(d, { featureProjection: 'EPSG:3857' });
          capaResaltadoSectorRef.current.clear();
          capaResaltadoSectorRef.current.addFeatures(features);

          const extent = features[0].getGeometry().getExtent();
          features.forEach(f => {
            const e = f.getGeometry().getExtent();
            import('ol/extent').then(({ extend }) => extend(extent, e));
          });

          mapaRef.current.getView().fit(extent, { duration: 1000, maxZoom: 19, padding: [50, 50, 50, 50] });
        }
      } catch (e) { console.error("Error zoom sector", e); }
    };
    doZoomSector();
  }, [sectorSeleccionado, inicializado]);

  useEffect(() => {
    if (!inicializado || !mapaRef.current || !bloqueSeleccionado) {
      if (!bloqueSeleccionado) {
        capaResaltadoBloqueRef.current?.clear();
        setEtiquetaBloque(null);
        setDatosPopup(null);
        overlayRef.current?.setPosition(undefined);
      }
      return;
    }
    capaResaltadoSectorRef.current?.clear();

    setDatosPopup(null);
    overlayRef.current?.setPosition(undefined);
    const doZoomB = async () => {
      // CORREGIDO: URL segura
      const url = `${GEOSERVER_URL}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=otavalo_cementerio:bloques_geom&outputFormat=application/json&CQL_FILTER=codigo='${bloqueSeleccionado.codigo}'`;
      try {
        const r = await fetch(url); const d = await r.json();
        if (d.features?.length) {
          const f = new GeoJSON().readFeatures(d, { featureProjection: 'EPSG:3857' });
          capaResaltadoBloqueRef.current.clear(); capaResaltadoBloqueRef.current.addFeatures(f);
          mapaRef.current.getView().fit(f[0].getGeometry().getExtent(), { duration: 800, maxZoom: 20, padding: [80, 80, 80, 80] });
          setEtiquetaBloque(bloqueSeleccionado.nombre || bloqueSeleccionado.codigo);
        }
      } catch (e) { }
    };
    doZoomB();
  }, [bloqueSeleccionado, inicializado]);

  return (
    <div className="mapa-cementerio-container">
      {etiquetaBloque && <div className="block-label"><span>📍</span><span>Bloque: {etiquetaBloque}</span></div>}

      {/* Controles de Rotación Manual */}
      <div className="map-rotation-controls">
        <button onClick={() => {
          if (mapaRef.current) {
            const view = mapaRef.current.getView();
            view.animate({ rotation: view.getRotation() - Math.PI / 4, duration: 300 });
          }
        }} className="rotation-btn" title="Rotar Izquierda">↺</button>
        <button onClick={() => {
          if (mapaRef.current) {
            const view = mapaRef.current.getView();
            view.animate({ rotation: view.getRotation() + Math.PI / 4, duration: 300 });
          }
        }} className="rotation-btn" title="Rotar Derecha">↻</button>
      </div>

      {cargando && <div className="map-loader"><div className="spinner" /><p>Cargando mapa...</p></div>}
      <div ref={mapElement} className="mapa-cementerio-mapa" />
      <div ref={popupRef} className="map-popup" style={{ display: datosPopup ? 'block' : 'none' }}>
        <div className="popup-header">
          <span className="popup-icon">📍</span>
          <h4 className="popup-title">Nicho {datosPopup?.codigo || '-'}</h4>
          <button onClick={cerrarNichoPopup} className="popup-close">×</button>
        </div>
        {datosPopup && (
          <div className="popup-content">
            <div className="popup-state-wrapper">
              <span className="popup-label">Estado:</span>
              <span className={`state-badge state-${datosPopup.estado?.toLowerCase()}`}>{datosPopup.estado || 'DESCONOCIDO'}</span>
            </div>
            <div className="popup-grid"><div className="info-card"><span className="info-label">Bloque</span><span className="info-value">{datosPopup.bloque || 'N/A'}</span></div><div className="info-card"><span className="info-label">Sector</span><span className="info-value">{datosPopup.sector || 'N/A'}</span></div></div>
            <div className="deceased-card"><h5 className="deceased-header">🕊️ INFORMACIÓN {datosPopup.difuntos?.length > 1 ? 'DE LOS DIFUNTOS' : 'DEL DIFUNTO'}</h5>
              {datosPopup.difuntos && datosPopup.difuntos.length > 0 ? (() => {
                const responsables = [...new Set(datosPopup.difuntos.map(d => d.responsable))];
                const mismoResponsable = responsables.length === 1;

                return (
                  <>
                    {mismoResponsable && (
                      <div className="deceased-info-group" style={{ marginBottom: '10px', borderBottom: '2px solid #ffebb0', paddingBottom: '8px' }}>
                        <span className="deceased-label">Responsable (Titular)</span>
                        <span className="deceased-value" style={{ fontWeight: 'bold' }}>{responsables[0]}</span>
                      </div>
                    )}

                    {datosPopup.difuntos.map((d, i) => (
                      <div key={i} className="deceased-item-group" style={{ marginBottom: '6px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                        <div className="deceased-info-group">
                          <span className="deceased-label">Difunto</span>
                          <span className="deceased-value">{d.nombre}</span>
                        </div>
                        {!mismoResponsable && (
                          <div className="deceased-info-group"><span className="deceased-label">Responsable</span><span className="deceased-value">{d.responsable}</span></div>
                        )}
                      </div>
                    ))}
                  </>
                );
              })() : (
                <div className="deceased-info-group"><span className="deceased-label">Difunto</span><span className="deceased-value">N/A</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MapaCementerio;