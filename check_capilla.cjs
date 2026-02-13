const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCapilla() {
    console.log('=== VERIFICACIÓN SECTOR CAPILLA ===\n');

    // 1. Bloques_geom del sector CAPILLA
    console.log('1. BLOQUES_GEOM del sector CAPILLA:');
    const { data: bloquesGeomCapilla } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('sector', 'CAPILLA');

    console.log(`Bloques encontrados: ${bloquesGeomCapilla?.length || 0}`);
    console.table(bloquesGeomCapilla);

    if (bloquesGeomCapilla && bloquesGeomCapilla.length > 0) {
        const ids = bloquesGeomCapilla.map(b => b.id);

        // 2. Bloques lógicos vinculados
        console.log('\n2. BLOQUES lógicos vinculados a estos bloques_geom:');
        const { data: bloquesLogicos } = await supabase
            .from('bloques')
            .select('id, codigo, nombre, bloque_geom_id')
            .in('bloque_geom_id', ids);

        console.log(`Bloques lógicos: ${bloquesLogicos?.length || 0}`);
        console.table(bloquesLogicos);

        // 3. Nichos en tabla nichos vinculados a estos bloques lógicos
        if (bloquesLogicos && bloquesLogicos.length > 0) {
            const bloqueIds = bloquesLogicos.map(b => b.id);
            console.log('\n3. NICHOS (tabla nichos) vinculados a bloques lógicos:');
            const { data: nichosAdmin } = await supabase
                .from('nichos')
                .select('id, codigo, socio_id, bloque_id, estado, disponible')
                .in('bloque_id', bloqueIds)
                .limit(10);

            console.log(`Nichos administrativos: ${nichosAdmin?.length || 0}`);
            console.table(nichosAdmin);

            // Estadísticas
            if (nichosAdmin && nichosAdmin.length > 0) {
                const ocupados = nichosAdmin.filter(n => n.estado?.toLowerCase() === 'ocupado').length;
                const disponibles = nichosAdmin.filter(n => n.socio_id === null).length;
                const mantenimiento = nichosAdmin.filter(n => n.estado?.toLowerCase() === 'mantenimiento').length;

                console.log('\n   ESTADÍSTICAS de nichos administrativos:');
                console.log(`   - Ocupados: ${ocupados}`);
                console.log(`   - Disponibles: ${disponibles}`);
                console.log(`   - Mantenimiento: ${mantenimiento}`);
            }
        }

        // 4. Nichos en nichos_geom
        console.log('\n4. NICHOS_GEOM vinculados por bloques_geom_id:');
        const { data: nichosGeom } = await supabase
            .from('nichos_geom')
            .select('id, codigo, estado, bloques_geom_id')
            .in('bloques_geom_id', ids)
            .limit(10);

        console.log(`Nichos geométricos: ${nichosGeom?.length || 0}`);
        console.table(nichosGeom);

        if (nichosGeom && nichosGeom.length > 0) {
            const ocupados = nichosGeom.filter(n => n.estado?.toLowerCase() === 'ocupado').length;
            const disponibles = nichosGeom.filter(n => n.estado?.toLowerCase() === 'disponible').length;
            const mantenimiento = nichosGeom.filter(n => n.estado?.toLowerCase() === 'mantenimiento').length;

            console.log('\n   ESTADÍSTICAS de nichos_geom:');
            console.log(`   - Ocupados: ${ocupados}`);
            console.log(`   - Disponibles: ${disponibles}`);
            console.log(`   - Mantenimiento: ${mantenimiento}`);
        }
    }
}

checkCapilla().catch(console.error);
