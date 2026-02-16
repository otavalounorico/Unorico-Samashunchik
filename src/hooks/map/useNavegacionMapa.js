import { useEffect } from 'react';
import { GeoJSON } from 'ol/format';
import { fetchWfsFeatures } from '../../services/servicioGeoServer';
import { obtenerDatosCompletoNicho } from '../../services/servicioCementerio';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';

export const useNavegacionMapa = ({
    map,
    isInitialized,
    nichoSeleccionado,
    bloqueSeleccionado,
    sectorSeleccionado,
    sourceResaltado,
    sourceBloque,
    sourceSector,
    onUpdatePopup, // callback para poner datos en el popup tras zoom (si aplica)
    onUpdateBlockLabel, // callback para poner etiqueta bloque
    onShowNotification, // callback para notificaciones
    popupOverlay,
    labelOverlay
}) => {

    // ZOOM NICHO
    useEffect(() => {
        if (!isInitialized || !map || !nichoSeleccionado?.codigo) return;

        const doZoom = async () => {
            const codigo = nichoSeleccionado.codigo;

            // 1. Intentar buscar geometría del Nicho
            const data = await fetchWfsFeatures({
                typeName: 'nichos_geom',
                cqlFilter: `codigo='${codigo}'`
            });

            if (data && data.features?.length) {
                // CASO A: Nicho existe en el mapa
                const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
                sourceResaltado.clear();
                sourceResaltado.addFeatures(features);

                const extent = features[0].getGeometry().getExtent();
                const currentZoom = map.getView().getZoom();

                // ZOOM INTELIGENTE: Si ya está cerca, solo mover centro. Si está lejos, hacer zoom.
                if (currentZoom > 20) {
                    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                    map.getView().animate({ center: center, duration: 800 });
                } else {
                    map.getView().fit(extent, { duration: 1000, maxZoom: 21, padding: [100, 100, 100, 100] });
                }

                // Update Popup if needed
                const props = features[0].getProperties();
                const datosCompletos = await obtenerDatosCompletoNicho(props);
                if (onUpdatePopup) onUpdatePopup(datosCompletos);

                // Position Overlay
                if (popupOverlay) {
                    popupOverlay.setPosition([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
                }

            } else {
                // CASO B: Nicho NO dibujado -> Fallback al Bloque
                console.warn(`Nicho ${codigo} no tiene geometría. Buscando bloque padre...`);

                // Buscar datos administrativos para saber el bloque
                import('../../services/servicioCementerio').then(async ({ getNichoAdminData }) => {
                    const adminData = await getNichoAdminData(codigo);

                    if (adminData && adminData.bloques) {
                        const nombreBloque = adminData.bloques.nombre;
                        const codigoBloque = adminData.bloques.codigo; // Asumiendo que 'codigo' es el link

                        // Notificar al usuario
                        if (onShowNotification) {
                            onShowNotification({
                                tipo: 'warning',
                                texto: `Ubicación aproximada en ${nombreBloque}`
                            });
                        }

                        // Obtener datos completos para el popup (aunque no haya geometría)
                        const datosCompletos = await obtenerDatosCompletoNicho({ codigo });
                        if (onUpdatePopup) onUpdatePopup(datosCompletos);

                        // Buscar geometría del Bloque
                        if (codigoBloque) {
                            const dataBloque = await fetchWfsFeatures({
                                typeName: 'bloques_geom',
                                cqlFilter: `codigo='${codigoBloque}'`
                            });

                            if (dataBloque && dataBloque.features?.length) {
                                const featuresB = new GeoJSON().readFeatures(dataBloque, { featureProjection: 'EPSG:3857' });

                                // Usamos sourceBloque para resaltar el bloque, no el nicho
                                sourceBloque?.clear();
                                sourceBloque?.addFeatures(featuresB);

                                const extentB = featuresB[0].getGeometry().getExtent();
                                map.getView().fit(extentB, { duration: 1000, maxZoom: 20, padding: [80, 80, 80, 80] });

                                // Mostrar etiqueta de bloque
                                if (onUpdateBlockLabel) {
                                    onUpdateBlockLabel(nombreBloque || codigoBloque);
                                }
                                // Posicionar Popup y Label en el centro del bloque
                                const centerB = [(extentB[0] + extentB[2]) / 2, (extentB[1] + extentB[3]) / 2];
                                if (labelOverlay) labelOverlay.setPosition(centerB);
                                if (popupOverlay) popupOverlay.setPosition(centerB);
                            }
                        }
                    } else {
                        if (onShowNotification) {
                            onShowNotification({
                                tipo: 'error',
                                texto: `Nicho ${codigo} no encontrado en mapa ni registros.`
                            });
                        }
                    }
                });
            }
        };
        doZoom();
    }, [nichoSeleccionado, isInitialized, map]);

    // ZOOM SECTOR
    useEffect(() => {
        if (!isInitialized || !map) return;
        if (!sectorSeleccionado) {
            sourceSector?.clear();
            return;
        }

        const doZoomSector = async () => {
            const data = await fetchWfsFeatures({
                typeName: 'bloques_geom',
                cqlFilter: `sector='${sectorSeleccionado}'`
            });

            if (data && data.features?.length) {
                const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
                sourceSector.clear();
                sourceSector.addFeatures(features);

                let extent = features[0].getGeometry().getExtent();
                features.forEach(f => {
                    const e = f.getGeometry().getExtent();
                    import('ol/extent').then(({ extend }) => extend(extent, e));
                });

                map.getView().fit(extent, { duration: 1000, maxZoom: 19, padding: [50, 50, 50, 50] });
            }
        };
        doZoomSector();
    }, [sectorSeleccionado, isInitialized, map]);

    // ZOOM BLOQUE
    useEffect(() => {
        if (!isInitialized || !map) return;

        // Si se deselecciona bloque, limpiar
        if (!bloqueSeleccionado) {
            sourceBloque?.clear();
            if (onUpdateBlockLabel) onUpdateBlockLabel(null);
            if (onUpdatePopup) onUpdatePopup(null);
            if (popupOverlay) popupOverlay.setPosition(undefined);
            if (labelOverlay) labelOverlay.setPosition(undefined);
            return;
        }

        // Limpiar sector al seleccionar bloque
        sourceSector?.clear();
        if (onUpdatePopup) onUpdatePopup(null);
        if (popupOverlay) popupOverlay.setPosition(undefined);

        const doZoomB = async () => {
            const data = await fetchWfsFeatures({
                typeName: 'bloques_geom',
                cqlFilter: `codigo='${bloqueSeleccionado.codigo}'`
            });

            if (data && data.features?.length) {
                const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
                sourceBloque.clear();
                sourceBloque.addFeatures(features);

                const extent = features[0].getGeometry().getExtent();
                map.getView().fit(extent, { duration: 800, maxZoom: 20, padding: [80, 80, 80, 80] });

                // Label handling
                if (onUpdateBlockLabel) {
                    onUpdateBlockLabel(bloqueSeleccionado.nombre || bloqueSeleccionado.codigo);
                }
                if (labelOverlay) {
                    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                    labelOverlay.setPosition(center);
                }
            }
        };
        doZoomB();
    }, [bloqueSeleccionado, isInitialized, map]);

    // RESET ZOOM (Volver al inicio cuando todo se cierra)
    useEffect(() => {
        if (!isInitialized || !map) return;

        // Si NO hay nada seleccionado
        if (!nichoSeleccionado?.codigo && !bloqueSeleccionado && !sectorSeleccionado) {
            console.log("Reseteando vista al inicio...");
            map.getView().animate({
                center: fromLonLat([-78.26549, 0.21908]),
                zoom: 19,
                rotation: 0.34,
                duration: 1200 // Un poco más lento para que sea suave
            });

            // Asegurar que se limpien los overlays
            if (popupOverlay) popupOverlay.setPosition(undefined);
            if (labelOverlay) labelOverlay.setPosition(undefined);
        }
    }, [nichoSeleccionado, bloqueSeleccionado, sectorSeleccionado, isInitialized, map]);
};
