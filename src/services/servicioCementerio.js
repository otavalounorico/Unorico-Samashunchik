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

    // PASO 1: Obtener id y socio_id del nicho
    let { data: nichoRow } = await supabase
        .from('nichos')
        .select('id, socio_id')
        .eq('codigo', codigo)
        .maybeSingle();

    // Fallback con ilike si el código tiene variaciones de mayúsculas
    if (!nichoRow) {
        const { data: rows } = await supabase
            .from('nichos')
            .select('id, socio_id')
            .ilike('codigo', codigo)
            .limit(1);
        if (rows && rows.length > 0) nichoRow = rows[0];
    }

    if (!nichoRow) return [];

    // PASO 2: Obtener nombre del responsable (socio)
    let responsableNombre = 'N/A';
    let targetSocioId = nichoRow.socio_id;

    // Si no está en el nicho directamente, buscar en la tabla intermedia socio_nicho como fallback
    if (!targetSocioId) {
        const { data: snRows } = await supabase
            .from('socio_nicho')
            .select('socio_id')
            .eq('nicho_id', nichoRow.id)
            .limit(1);
        if (snRows && snRows.length > 0) {
            targetSocioId = snRows[0].socio_id;
        }
    }

    if (targetSocioId) {
        const { data: socioRow } = await supabase
            .from('socios')
            .select('nombres, apellidos')
            .eq('id', targetSocioId)
            .maybeSingle();
        if (socioRow) {
            responsableNombre = `${socioRow.nombres} ${socioRow.apellidos}`;
        }
    }

    // PASO 3: Obtener filas de fallecido_nicho para este nicho
    const { data: relRows, error: errRel } = await supabase
        .from('fallecido_nicho')
        .select('fallecido_id, socio_id')
        .eq('nicho_id', nichoRow.id)
        .order('created_at', { ascending: false });

    if (errRel) {
        console.error("Error buscando fallecido_nicho:", errRel);
        return { responsable: responsableNombre, difuntos: [] };
    }

    if (!relRows || relRows.length === 0) {
        return { responsable: responsableNombre, difuntos: [] };
    }

    // PASO 4: Obtener datos de cada fallecido y su responsable específico
    const difuntos = [];
    for (const rel of relRows) {
        if (!rel.fallecido_id) continue;

        const { data: fallecido } = await supabase
            .from('fallecidos')
            .select('nombres, apellidos')
            .eq('id', rel.fallecido_id)
            .maybeSingle();

        // Responsable: primero el del registro fallecido_nicho, si no el del nicho
        let respNombre = responsableNombre;
        if (rel.socio_id) {
            const { data: socioRel } = await supabase
                .from('socios')
                .select('nombres, apellidos')
                .eq('id', rel.socio_id)
                .maybeSingle();
            if (socioRel) respNombre = `${socioRel.nombres} ${socioRel.apellidos}`;
        }

        if (fallecido) {
            difuntos.push({
                nombre: `${fallecido.nombres} ${fallecido.apellidos}`,
                responsable: respNombre
            });
        }
    }

    return { responsable: responsableNombre, difuntos };
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

    // 4. Difuntos y Responsable
    const info = await getDifuntosByNichoCodigo(codigoRaw);
    datosFinales.responsable = info?.responsable || 'N/A';
    datosFinales.difuntos = info?.difuntos || [];

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
