import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';

export const useResaltadoMapa = (map, isInitialized) => {

    const sourcesRef = useRef({
        resaltado: new VectorSource(),
        bloque: new VectorSource(),
        sector: new VectorSource(),
        estados: new VectorSource()
    });

    useEffect(() => {
        if (!isInitialized || !map) return;

        // Evitar duplicados
        const currentLayers = map.getLayers().getArray();
        // Aunque OL gestiona bien las capas, es mejor asegurar una sola instancia

        console.log("Configurando capas de resaltado vectorial...");

        // Estilos
        const styleResaltado = new Style({
            stroke: new Stroke({ color: '#ef4444', width: 4 }),
            fill: new Fill({ color: 'rgba(239, 68, 68, 0.2)' })
        });

        const styleBloque = new Style({
            stroke: new Stroke({ color: '#8B5CF6', width: 2 }),
            fill: new Fill({ color: 'rgba(139, 92, 246, 0.15)' })
        });

        const styleSector = new Style({
            stroke: new Stroke({ color: '#8B5CF6', width: 2.5 }),
            fill: new Fill({ color: 'rgba(139, 92, 246, 0.12)' })
        });

        const styleEstados = (feature) => {
            const est = (feature.get('estado') || feature.get('ESTADO') || feature.get('Estado') || '').toLowerCase();
            const colors = {
                ocupado: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.7)' },
                disponible: { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.7)' },
                mantenimiento: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.7)' },
                reservado: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.7)' },
                malas: { stroke: '#991b1b', fill: 'rgba(153, 27, 27, 0.8)' },
                malo: { stroke: '#991b1b', fill: 'rgba(153, 27, 27, 0.8)' }
            };
            const c = colors[est] || { stroke: '#94a3b8', fill: 'rgba(148, 163, 184, 0.2)' };
            return new Style({
                stroke: new Stroke({ color: c.stroke, width: 2 }),
                fill: new Fill({ color: c.fill })
            });
        };

        // Crear capas
        const layerResaltado = new VectorLayer({ source: sourcesRef.current.resaltado, zIndex: 999, style: styleResaltado });
        const layerBloque = new VectorLayer({ source: sourcesRef.current.bloque, zIndex: 998, style: styleBloque });
        const layerSector = new VectorLayer({ source: sourcesRef.current.sector, zIndex: 997, style: styleSector });
        const layerEstados = new VectorLayer({ source: sourcesRef.current.estados, zIndex: 990, style: styleEstados });

        map.addLayer(layerEstados);
        map.addLayer(layerSector);
        map.addLayer(layerBloque);
        map.addLayer(layerResaltado);

        return () => {
            // Cleanup layers if needed, though usually map destruction handles it
        };

    }, [isInitialized, map]);

    return sourcesRef.current;
};
