const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstados() {
    console.log('=== VERIFICACIÓN DE ESTADOS ===\n');

    // 1. Ver los 3 nichos administrativos y sus estados
    console.log('1. NICHOS ADMINISTRATIVOS (tabla nichos):');
    const { data: nichosAdmin } = await supabase
        .from('nichos')
        .select('id, codigo, estado, nicho_geom_id');

    console.table(nichosAdmin);

    // 2. Ver los estados en nichos_geom para esos mismos nichos
    if (nichosAdmin && nichosAdmin.length > 0) {
        const geomIds = nichosAdmin.map(n => n.nicho_geom_id).filter(id => id != null);

        console.log('\n2. ESTADOS EN NICHOS_GEOM (para los mismos nichos):');
        const { data: nichosGeom } = await supabase
            .from('nichos_geom')
            .select('id, codigo, estado')
            .in('id', geomIds);

        console.table(nichosGeom);

        // 3. Comparación
        console.log('\n3. COMPARACIÓN ADMIN vs GEOM:');
        nichosAdmin.forEach(admin => {
            const geom = nichosGeom?.find(g => g.id === admin.nicho_geom_id);
            if (geom) {
                const sync = admin.estado?.toUpperCase() === geom.estado?.toUpperCase();
                console.log(`${admin.codigo}:`);
                console.log(`  Admin: ${admin.estado}`);
                console.log(`  Geom:  ${geom.estado}`);
                console.log(`  ${sync ? '✓ SINCRONIZADO' : '✗ DESINCRONIZADO'}`);
            }
        });
    }

    // 4. Ver un bloque completo del sector GÉNESIS
    console.log('\n4. TODOS LOS NICHOS DEL BLOQUE B-06 (GÉNESIS):');
    const { data: bloqueGenesisB06 } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado')
        .eq('bloques_geom_id', 2)
        .limit(10);

    console.table(bloqueGenesisB06);

    if (bloqueGenesisB06) {
        const ocupados = bloqueGenesisB06.filter(n => n.estado?.toUpperCase() === 'OCUPADO').length;
        const mant = bloqueGenesisB06.filter(n => n.estado?.toUpperCase() === 'MANTENIMIENTO').length;
        const disp = bloqueGenesisB06.filter(n => n.estado?.toUpperCase() === 'DISPONIBLE').length;

        console.log('\nCONTEO:');
        console.log(`Total: ${bloqueGenesisB06.length}`);
        console.log(`Ocupados: ${ocupados}`);
        console.log(`Mantenimiento: ${mant}`);
        console.log(`Disponibles: ${disp}`);
    }
}

verificarEstados().catch(console.error);
