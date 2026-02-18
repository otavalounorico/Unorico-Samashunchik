/**
 * Servicio para interactuar con GeoServer (WMS/WFS)
 */

// CONFIGURACIÓN
// Si reinicias el túnel, SOLO CAMBIA ESTA LÍNEA con el nuevo enlace:
//const GEOSERVER_BASE_URL = 'http://localhost:8080/geoserver/otavalo_cementerio';
const GEOSERVER_BASE_URL = 'http://192.168.20.100:8080/geoserver/otavalo_cementerio';

export const getGeoServerUrl = () => GEOSERVER_BASE_URL;

/**
 * Genera la URL para una capa WMS
 */
export const getWmsLayerSourceParams = (layerName) => {
    return {
        url: `${GEOSERVER_BASE_URL}/wms`,
        params: {
            'LAYERS': `otavalo_cementerio:${layerName}`,
            'TILED': true,
            'TRANSPARENT': true
        },
        serverType: 'geoserver'
    };
};

/**
 * Construye una URL WFS segura reemplazando localhost si es necesario
 */
export const getSafeWfsUrl = (url) => {
    if (!url) return null;
    // Si la URL generada por OL ya empieza con nuestra GEOSERVER_URL, no hacemos nada.
    if (!url.startsWith(GEOSERVER_BASE_URL)) {
        return url.replace(/http:\/\/localhost:8080\/geoserver/gi, GEOSERVER_BASE_URL);
    }
    return url;
};

/**
 * Obtiene features por filtro CQL (WFS)
 */
export const fetchWfsFeatures = async ({ typeName, cqlFilter, maxFeatures, outputFormat = 'application/json' }) => {
    try {
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',
            request: 'GetFeature',
            typeName: `otavalo_cementerio:${typeName}`,
            outputFormat: outputFormat,
        });

        if (cqlFilter) params.append('CQL_FILTER', cqlFilter);
        if (maxFeatures) params.append('maxFeatures', maxFeatures);

        const url = `${GEOSERVER_BASE_URL}/ows?${params.toString()}`;
        // Fix: URLSearchParams encodes spaces as +, GeoServer might prefer %20 or literal spaces in some versions, but usually + is fine.
        // However, to be safe and match previous successful manual strings:
        const safeUrl = url.replace(/\+/g, '%20'); // Optional refinement if needed

        console.log(`[GeoServerService] Fetching: ${safeUrl}`);
        const response = await fetch(safeUrl);

        if (!response.ok) {
            throw new Error(`Error fetching WFS: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("[GeoServerService] Error:", error);
        return null;
    }
};

/**
 * Fetch para obtener información de feature en un punto (GetFeatureInfo)
 * Se usa la URL generada por OpenLayers pero asegurando el dominio.
 */
export const fetchFeatureInfoFromUrl = async (generatedUrl) => {
    const safeUrl = getSafeWfsUrl(generatedUrl);
    console.log("[GeoServerService] Secure URL for FeatureInfo:", safeUrl);

    try {
        const response = await fetch(safeUrl);
        if (!response.ok) throw new Error(`Error feature info: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("[GeoServerService] Error in fetchFeatureInfoFromUrl:", error);
        return null;
    }
};
