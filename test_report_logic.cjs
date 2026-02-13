const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportLogic() {
    console.log('=== PRUEBA DE LÓGICA DEL REPORTE ===\n');

    // Simular lo que hace el reporte para el bloque B-01 del sector CAPILLA
    const bgId = 8; // ID del bloque B-01 en CAPILLA
    const cod = 'B-01';
    const nombreBloque = 'Bloque 01';

    console.log(`Probando reporte para: ${cod} - ${nombreBloque} (bloques_geom_id: ${bgId})\n`);

    // Paso 1: Obtener nichos_geom
    console.log('PASO 1: Obtener nichos_geom del bloque');
    const { data: geomList } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado')
        .eq('bloques_geom_id', bgId);

    console.log(`  - Nichos_geom encontrados: ${geomList?.length || 0}`);
    if (geomList && geomList.length > 0) {
        console.log(`  - Primeros 3 códigos: ${geomList.slice(0, 3).map(n => n.codigo).join(', ')}`);
        console.log(`  - Primeros 3 estados: ${geomList.slice(0, 3).map(n => n.estado).join(', ')}`);
    }

    // Paso 2: Intentar obtener nichos administrativos
    let feats = geomList || [];
    if (geomList && geomList.length > 0) {
        const nichosGeomIds = geomList.map(n => n.id);

        console.log('\nPASO 2: Buscar nichos administrativos por nicho_geom_id');
        const { data: adminData } = await supabase
            .from('nichos')
            .select('codigo, estado, socio_id, disponible, nicho_geom_id')
            .in('nicho_geom_id', nichosGeomIds);

        console.log(`  - Nichos administrativos encontrados: ${adminData?.length || 0}`);
        if (adminData && adminData.length > 0) {
            console.log('  - Usando datos administrativos:');
            console.table(adminData);
            feats = adminData;
        } else {
            console.log('  - No hay datos administrativos, usando solo geométricos');
        }
    }

    // Paso 3: Conteo
    console.log('\nPASO 3: Conteo de estados');
    const tieneSocioId = feats.length > 0 && 'socio_id' in feats[0];
    console.log(`  - ¿Tiene socio_id? ${tieneSocioId ? 'SÍ (datos admin)' : 'NO (datos geom)'}`);

    let ocup = 0, mant = 0, disp = 0;

    if (tieneSocioId) {
        // Datos administrativos
        ocup = feats.filter(n => n.estado?.toLowerCase() === 'ocupado' || n.estado?.toLowerCase().includes('ocup')).length;
        mant = feats.filter(n => n.estado?.toLowerCase() === 'mantenimiento' || n.estado?.toLowerCase().includes('mant')).length;
        disp = feats.filter(n => n.socio_id === null && n.estado?.toLowerCase() !== 'mantenimiento').length;
    } else {
        // Datos geométricos
        ocup = feats.filter(n => n.estado?.toLowerCase() === 'ocupado').length;
        mant = feats.filter(n => n.estado?.toLowerCase() === 'mantenimiento').length;
        disp = feats.filter(n => n.estado?.toLowerCase() === 'disponible').length;
    }

    console.log('\nRESULTADOS:');
    console.log(`  - Total: ${feats.length}`);
    console.log(`  - Ocupados: ${ocup}`);
    console.log(`  - Disponibles: ${disp}`);
    console.log(`  - Mantenimiento: ${mant}`);
}

testReportLogic().catch(console.error);
