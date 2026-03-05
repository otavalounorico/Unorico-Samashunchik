import { supabase } from '../api/supabaseClient';

/**
 * Servicio para interactuar con Supabase (Datos del Cementerio)
 */

export const getNichoAdminData = async (codigo) => {
    if (!codigo) return null;
    const { data, error } = await supabase
        .from('nichos')
        .select('bloques(nombre, codigo, bloques_geom(sector))')
        .eq('codigo', codigo)
        .maybeSingle();

    if (error) console.error("Error buscando nicho admin:", error);
    return data;
};

export const getNichoGeomData = async (codigo) => {
    if (!codigo) return null;
    const { data, error } = await supabase
        .from('nichos_geom')
        .select('bloques_geom_id, estado')
        .eq('codigo', codigo)
        .maybeSingle();

    if (error) console.error("Error buscando nicho geom:", error);
    return data;
};

export const getBloqueGeomById = async (id) => {
    const { data } = await supabase
        .from('bloques_geom')
        .select('nombre, sector, codigo')
        .eq('id', id)
        .maybeSingle();
    return data;
};

export const getNichoEstadoAdmin = async (codigo) => {
    const { data, error } = await supabase
        .from('nichos')
        .select('estado')
        .eq('codigo', codigo)
        .maybeSingle();
    if (error) console.error("Error buscando estado admin:", error);
    return data;
};

export const getDifuntosByNichoCodigo = async (codigo) => {
    if (!codigo) return [];

    // 1. Buscar ID del nicho + socio responsable (titular del nicho)
    let { data: nAdmin, error: errN } = await supabase
        .from('nichos')
        .select('id, socios(nombres, apellidos)')
        .eq('codigo', codigo)
        .maybeSingle();

    if (!nAdmin) {
        const { data: nLike } = await supabase
            .from('nichos')
            .select('id, socios(nombres, apellidos)')
            .ilike('codigo', codigo)
            .limit(1);
        if (nLike && nLike.length > 0) nAdmin = nLike[0];
    }

    if (!nAdmin) return [];

    const responsableNombre = nAdmin.socios
        ? `${nAdmin.socios.nombres} ${nAdmin.socios.apellidos}`
        : 'No definido';

    // 2. Buscar difuntos asociados a este nicho (sin filtrar por fecha_exhumacion)
    const { data: rel, error: errRel } = await supabase
        .from('fallecido_nicho')
        .select(`fallecidos (nombres, apellidos, fecha_fallecimiento)`)
        .eq('nicho_id', nAdmin.id)
        .order('created_at', { ascending: false });

    if (errRel) {
        console.error("Error buscando difuntos:", errRel);
        return [];
    }

    // 3. Mapear difuntos con el responsable del nicho
    return (rel || []).map(d => ({
        nombre: d.fallecidos ? `${d.fallecidos.nombres} ${d.fallecidos.apellidos}` : 'Desconocido',
        responsable: responsableNombre
    }));
};


/**
 * Orquestador principal para obtener toda la info de un nicho
 * Combina datos administrativos, geométricos y de difuntos.
 */
export const obtenerDatosCompletoNicho = async (props) => {
    // Normalizar código
    let codigoRaw = props.codigo || props.CODIGO || props.Codigo;
    if (codigoRaw && typeof codigoRaw === 'string') {
        codigoRaw = codigoRaw.trim();
    }

    console.log("Obteniendo datos completos para:", codigoRaw);

    const datosFinales = { ...props, codigo: codigoRaw };
    let bloqueEncontrado = false;

    // 1. Datos Administrativos
    const adminData = await getNichoAdminData(codigoRaw);
    if (adminData && adminData.bloques) {
        datosFinales.bloque = `${adminData.bloques.nombre} (${adminData.bloques.codigo || 'S/C'})`;
        if (adminData.bloques.bloques_geom) {
            datosFinales.sector = adminData.bloques.bloques_geom.sector;
        }
        bloqueEncontrado = true;
    }

    // 2. Geometría (Fallback)
    const geomData = await getNichoGeomData(codigoRaw);
    if (geomData) {
        if (geomData.bloques_geom_id && !bloqueEncontrado) {
            const bGeom = await getBloqueGeomById(geomData.bloques_geom_id);
            if (bGeom) {
                datosFinales.bloque = `${bGeom.nombre} (${bGeom.codigo})`;
                datosFinales.sector = bGeom.sector;
                bloqueEncontrado = true;
            }
        }
        if (!datosFinales.estado && geomData.estado) {
            datosFinales.estado = geomData.estado;
        }
    }

    // 3. Estado Admin (Prioridad)
    const estadoData = await getNichoEstadoAdmin(codigoRaw);
    if (estadoData && estadoData.estado) {
        datosFinales.estado = estadoData.estado;
    }

    // 4. Difuntos (ya vienen mapeados con { nombre, responsable })
    const difuntosRaw = await getDifuntosByNichoCodigo(codigoRaw);
    datosFinales.difuntos = difuntosRaw || [];

    // Default
    if (!datosFinales.estado) {
        datosFinales.estado = 'DESCONOCIDO';
    }

    return datosFinales;
};

/**
 * Obtener nichos por lista de estados (Para filtrado y pintado)
 */
export const getNichosByEstadosList = async (estadosVisibles) => {
    if (!estadosVisibles || estadosVisibles.length === 0) return { data: [] };

    let filtrosOR = [];
    if (estadosVisibles.includes('Estado_Bueno')) filtrosOR.push(`estado.ilike.BUENO`);
    if (estadosVisibles.includes('Estado_Malo')) filtrosOR.push(`estado.ilike.MALO`);
    if (estadosVisibles.includes('Mantenimiento')) filtrosOR.push(`estado.ilike.MANTENIMIENTO`);
    if (estadosVisibles.includes('Abandonado')) filtrosOR.push(`estado.ilike.ABANDONADO`);

    if (filtrosOR.length === 0) return { data: [] };

    return await supabase
        .from('nichos')
        .select('codigo, estado, disponible, socio_id')
        .or(filtrosOR.join(','))
        .range(0, 19999);
};

export const getNichosGeomDisponibles = async () => {
    return await supabase
        .from('nichos_geom')
        .select('codigo, estado')
        .ilike('estado', 'DISPONIBLE')
        .range(0, 19999);
};
