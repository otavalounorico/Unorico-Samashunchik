const { createClient } = require('@supabase/supabase-js');

// Credenciales obtenidas de src/api/supabaseClient.js
const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSync() {
    console.log("Verificando sincronización de estados...");

    // 1. Traer nichos administrativos
    const { data: nichosAdmin, error: errA } = await supabase
        .from('nichos')
        .select('codigo, estado');

    if (errA) {
        console.error("Error trayendo nichos:", errA);
        return;
    }

    // 2. Traer nichos geométricos
    // Traemos todo podría ser mucho. Paginamos o traemos solo campos necesarios.
    // Asumimos que caben en memoria para este diagnóstico rápido (o limitamos)
    const { data: nichosGeom, error: errG } = await supabase
        .from('nichos_geom')
        .select('codigo, estado');

    if (errG) {
        console.error("Error trayendo nichos_geom:", errG);
        return;
    }

    const mapGeom = new Map();
    nichosGeom.forEach(n => mapGeom.set(n.codigo, n.estado));

    let discrepancias = 0;
    let totalRevisados = 0;

    nichosAdmin.forEach(admin => {
        if (!admin.codigo) {
            if (admin.estado === 'MANTENIMIENTO') {
                console.warn(`Nicho ID ${admin.id} tiene estado MANTENIMIENTO pero SIN CODIGO.`);
            }
            return;
        }

        const geomEstado = mapGeom.get(admin.codigo);

        // Debug específico para mantenimiento
        if (admin.estado === 'MANTENIMIENTO') {
            console.log(`[DEBUG MANTENIMIENTO] Codigo: ${admin.codigo}, Estado Admin: ${admin.estado}, Estado Geom: ${geomEstado || 'NO ENCONTRADO'}`);
        }

        if (geomEstado !== undefined) {
            totalRevisados++;
            const stAdmin = (admin.estado || '').toUpperCase().trim();
            const stGeom = (geomEstado || '').toUpperCase().trim();

            if (stAdmin !== stGeom) {
                discrepancias++;
                console.log(`Discrepancia en ${admin.codigo}: Admin='${stAdmin}' vs Geom='${stGeom}'`);
            }
        } else {
            if (admin.estado === 'MANTENIMIENTO') {
                console.warn(`Nicho ${admin.codigo} es MANTENIMIENTO en admin pero NO EXISTE en geom.`);
            }
        }
    });

    console.log(`\nResumen:`);
    console.log(`Total coincidentes (por código): ${totalRevisados}`);
    console.log(`Discrepancias encontradas: ${discrepancias}`);

    if (discrepancias > 0) {
        console.log("El trigger parece no estar funcionando o los datos están desactualizados.");
    } else {
        console.log("Los datos parecen estar sincronizados.");
    }
}

checkSync();
