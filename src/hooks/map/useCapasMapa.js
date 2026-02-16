import { useEffect, useState } from 'react';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { getWmsLayerSourceParams } from '../../services/servicioGeoServer';

export const useCapasMapa = (map, isInitialized, layersVisibility) => {
    const [layers, setLayers] = useState({
        cementerio_general: null,
        infraestructura: null,
        bloques_geom: null,
        nichos_geom: null
    });

    // 1. Crear y añadir capas al inicializar
    useEffect(() => {
        if (!isInitialized || !map) return;

        // Evitar recrear si ya existen (aunque con useState y [] deps debería ser seguro,
        // pero verificamos si ya están en el estado)
        if (layers.cementerio_general) return;

        console.log("Añadiendo Capas WMS...");

        const createLayer = (layerName, zIndex) => {
            return new TileLayer({
                source: new TileWMS(getWmsLayerSourceParams(layerName)),
                zIndex: zIndex,
                visible: true // Visible por defecto, luego se controla por prop
            });
        };

        const nuevasCapas = {
            cementerio_general: createLayer('cementerio_general', 1),
            infraestructura: createLayer('infraestructura', 2),
            bloques_geom: createLayer('bloques_geom', 3),
            nichos_geom: createLayer('nichos_geom', 4)
        };

        // Añadir al mapa
        Object.values(nuevasCapas).forEach(layer => map.addLayer(layer));

        // Actualizar estado para que el componente padre reciba las capas reales
        setLayers(nuevasCapas);

    }, [isInitialized, map]);

    // 2. Controlar visibilidad
    useEffect(() => {
        if (!layers.cementerio_general) return;

        const { cementerio_general, infraestructura, bloques_geom, nichos_geom } = layers;

        if (cementerio_general) cementerio_general.setVisible(!!layersVisibility?.cementerio_general);
        if (infraestructura) infraestructura.setVisible(!!layersVisibility?.infraestructura);
        if (bloques_geom) bloques_geom.setVisible(!!layersVisibility?.bloques_geom);
        if (nichos_geom) nichos_geom.setVisible(!!layersVisibility?.nichos_geom);

    }, [layersVisibility, layers]);

    return layers;
};
