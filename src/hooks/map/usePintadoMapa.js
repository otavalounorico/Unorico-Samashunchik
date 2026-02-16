import { useEffect } from 'react';
import { GeoJSON } from 'ol/format';
import { getNichosByEstadosList, getNichosGeomDisponibles } from '../../services/servicioCementerio';
import { fetchWfsFeatures, getGeoServerUrl } from '../../services/servicioGeoServer';

/**
 * Hook para gestionar el "Pintado" de nichos según filtros de estado.
 * Implementa estrategia híbrida: Bulk fetch para disponibles vs Chunk fetch para el resto.
 */
export const usePintadoMapa = (map, isInitialized, estadosVisibles, sourceEstados, layerNichos) => {

    useEffect(() => {
        if (!isInitialized || !sourceEstados || !layerNichos) return;

        // Resetear filtro CQL de la capa WMS base si fuera necesario (aunque aqui trabajamos con capa vectorial encima)
        layerNichos.getSource().updateParams({ 'CQL_FILTER': undefined });
        sourceEstados.clear();

        if (!estadosVisibles || estadosVisibles.length === 0) return;

        // Caso especial solicitado: Si solo está "Ocupado", no mostrar nada (optimización visual)
        if (estadosVisibles.length === 1 && estadosVisibles.includes('Ocupado')) {
            return;
        }

        const actualizarPintado = async () => {
            sourceEstados.clear();
            if (!map) return;

            try {
                // 1. Obtener datos administrativos (Nichos Ocupados/Mantenimiento)
                const { data: resNichos } = await getNichosByEstadosList(estadosVisibles);

                // 2. Obtener datos geométricos (Disponibles)
                const verLibres = estadosVisibles.includes('Disponible');
                const { data: resGeom } = verLibres ? await getNichosGeomDisponibles() : { data: [] };

                let listaFinal = [];

                // Procesar Admin Data
                if (resNichos) {
                    const filtrados = resNichos.filter(n => {
                        const est = n.estado?.toLowerCase();
                        if (estadosVisibles.includes('Mantenimiento') && est === 'mantenimiento') return true;
                        if (estadosVisibles.includes('Estado_Bueno') && est === 'ocupado' && n.disponible === true) return true;
                        if (estadosVisibles.includes('Estado_Malo') && est === 'ocupado' && n.disponible === false) return true;
                        return false;
                    });
                    listaFinal = [...listaFinal, ...filtrados];
                }

                // Procesar Geom Data
                if (resGeom) {
                    const libres = resGeom.map(g => ({
                        codigo: g.codigo,
                        estado: 'DISPONIBLE',
                        disponible: true
                    }));
                    listaFinal = [...listaFinal, ...libres];
                }

                if (listaFinal.length === 0) return;

                // ESTRATEGIAS DE FETCH
                const codigosLibres = listaFinal.filter(n => n.estado === 'DISPONIBLE').map(n => n.codigo);
                const codigosResto = listaFinal.filter(n => n.estado !== 'DISPONIBLE').map(n => n.codigo);
                const codigosRestoUnicos = [...new Set(codigosResto)];

                // Helper para asignar color/estado a features
                const procesarFeatures = (features) => {
                    features.forEach(f => {
                        const codigoF = f.get('codigo') || f.get('CODIGO');
                        const d = listaFinal.find(n => n.codigo === codigoF);
                        if (d) {
                            let colorKey = '';
                            if (d.estado === 'DISPONIBLE') colorKey = 'disponible';
                            else if (d.estado?.toLowerCase() === 'mantenimiento') colorKey = 'mantenimiento';
                            else if (d.estado?.toLowerCase() === 'ocupado') {
                                colorKey = d.disponible ? 'ocupado' : 'malas';
                            }
                            if (colorKey) f.set('estado', colorKey);
                        }
                    });
                    sourceEstados.addFeatures(features);
                };

                // ESTRATEGIA 1: BULK FETCH (Disponibles)
                if (codigosLibres.length > 0) {
                    // Pedimos TODOS los disponibles usando WFS CQL
                    // "estado='DISPONIBLE'" en WFS
                    const data = await fetchWfsFeatures({
                        typeName: 'nichos_geom',
                        cqlFilter: "estado='DISPONIBLE'",
                        maxFeatures: 20000
                    });

                    if (data && data.features) {
                        const features = new GeoJSON().readFeatures(data, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
                        // Filtrar contra la lista de conflictos (si un ID también está en admin Ocupado)
                        const featuresVerdes = features.filter(f => {
                            const c = f.get('codigo') || f.get('CODIGO');
                            return !codigosResto.includes(c);
                        });
                        featuresVerdes.forEach(f => f.set('estado', 'disponible'));
                        sourceEstados.addFeatures(featuresVerdes);
                    }
                }

                // ESTRATEGIA 2: CHUNK FETCH (Ocupados/Mantenimiento)
                if (codigosRestoUnicos.length > 0) {
                    const CHUNK_SIZE = 50;
                    const chunks = [];
                    for (let i = 0; i < codigosRestoUnicos.length; i += CHUNK_SIZE) {
                        chunks.push(codigosRestoUnicos.slice(i, i + CHUNK_SIZE));
                    }

                    const procesarChunk = async (chunk) => {
                        const safeChunk = chunk.map(c => `'${c.replace(/'/g, "''")}'`);
                        const filter = `codigo IN (${safeChunk.join(',')})`;

                        const data = await fetchWfsFeatures({
                            typeName: 'nichos_geom',
                            cqlFilter: filter
                        });

                        if (data && data.features) {
                            const features = new GeoJSON().readFeatures(data, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
                            procesarFeatures(features);
                        }
                    };

                    const CONCURRENCY = 5;
                    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
                        const batch = chunks.slice(i, i + CONCURRENCY);
                        await Promise.all(batch.map(chunk => procesarChunk(chunk)));
                    }
                }

            } catch (e) {
                console.error("Error pintado mapa:", e);
            }
        };

        actualizarPintado();

    }, [estadosVisibles, isInitialized, map, sourceEstados, layerNichos]);
};
