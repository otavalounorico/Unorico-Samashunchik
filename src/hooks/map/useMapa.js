import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';

export const useMapa = (mapElement) => {
    const mapRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (mapRef.current || !mapElement.current) return;

        console.log("Inicializando Mapa OpenLayers...");

        const map = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                    zIndex: 0,
                    visible: true
                })
            ],
            view: new View({
                center: fromLonLat([-78.26549, 0.21908]), // Coordenadas exactas Cementerio Otavalo
                zoom: 19,
                minZoom: 16,
                maxZoom: 22,
                rotation: 0.34 // Ajuste fino
            }),
            controls: defaultControls({
                rotateOptions: { autoHide: false, tipLabel: 'Restablecer Norte' }
            })
        });

        mapRef.current = map;
        setIsInitialized(true);

        return () => {
            if (mapRef.current) {
                mapRef.current.setTarget(null);
                mapRef.current = null;
            }
        };
    }, [mapElement]);

    return { map: mapRef.current, isInitialized };
};
