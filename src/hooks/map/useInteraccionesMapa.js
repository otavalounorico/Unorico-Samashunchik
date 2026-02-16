import { useEffect } from 'react';
import { GeoJSON } from 'ol/format';
import { fetchFeatureInfoFromUrl, getGeoServerUrl } from '../../services/servicioGeoServer';
import { obtenerDatosCompletoNicho } from '../../services/servicioCementerio';

/**
 * Maneja las interacciones del usuario con el mapa (Clicks)
 */
export const useInteraccionesMapa = ({
    map,
    isInitialized,
    layerNichos,   // La capa WMS de nichos para hacer GetFeatureInfo
    sourceResaltado, // Source vectorial para resaltar la selección
    onNichoSelected, // Callback al seleccionar
    onDeselected     // Callback al limpiar
}) => {

    useEffect(() => {
        if (!isInitialized || !map) return;

        const handleSingleClick = async (evt) => {
            console.log("--- CLICK EN MAPA ---");

            // Limpiar selección previa
            if (onDeselected) onDeselected();
            if (sourceResaltado) sourceResaltado.clear();

            if (!layerNichos) {
                console.warn("Capa nichos_geom no disponible para consulta");
                return;
            }

            const view = map.getView();
            const source = layerNichos.getSource();

            // 1. Obtener URL del WMS GetFeatureInfo
            const url = source.getFeatureInfoUrl(
                evt.coordinate,
                view.getResolution(),
                view.getProjection(),
                { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 1 }
            );

            if (url) {
                try {
                    // 2. Usar servicio para fetch seguro
                    const data = await fetchFeatureInfoFromUrl(url);
                    console.log("Data recibida WFS:", data);

                    if (data && data.features && data.features.length > 0) {
                        // 3. Resaltar Feature
                        const feature = new GeoJSON().readFeature(data.features[0]);
                        if (sourceResaltado) sourceResaltado.addFeature(feature);

                        const props = data.features[0].properties;
                        console.log("Propiedades Feature:", props);

                        // 4. Obtener Datos Completos (Supabase + Admin)
                        const datosFinales = await obtenerDatosCompletoNicho(props);
                        console.log("Datos Finales para Popup:", datosFinales);

                        // 5. Notificar selección
                        if (onNichoSelected) {
                            onNichoSelected({
                                data: datosFinales,
                                coordinate: evt.coordinate
                            });
                        }

                        // 6. Zoom suave (opcional)
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
                    }
                } catch (e) {
                    console.error("Error en singleclick:", e);
                }
            }
        };

        map.on('singleclick', handleSingleClick);

        return () => {
            map.un('singleclick', handleSingleClick);
        };
    }, [isInitialized, map, layerNichos, sourceResaltado]);
};
