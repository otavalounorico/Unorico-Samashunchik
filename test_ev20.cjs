const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEspacioVerde() {
    console.log('=== PRUEBA BLOQUE EV-20 (Espacio verde) CAPILLA ===\n');

    const bgId = 1; // Espacio verde
    const cod = 'EV-20';

    console.log(`Probando: ${cod} (bloques_geom_id: ${bgId})\n`);

    // Paso 1: nichos_geom
    console.log('PASO 1: Nichos_geom');
    const { data: geomList } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado')
        .eq('bloques_geom_id', bgId);

    console.log(`  Encontrados: ${geomList?.length || 0}`);
    if (geomList && geomList.length > 0) {
        const ids = geomList.map(n => n.id);
        console.log(`  IDs: ${ids.slice(0, 5).join(', ')}...`);

        // Paso 2: Buscar administrativos
        console.log('\nPASO 2: Nichos administrativos');
        const { data: adminData } = await supabase
            .from('nichos')
            .select('codigo, estado, socio_id, disponible, nicho_geom_id')
            .in('nicho_geom_id', ids);

        console.log(`  Encontrados: ${adminData?.length || 0}`);
        if (adminData && adminData.length > 0) {
            console.table(adminData);

            // Conteo
            const ocup = adminData.filter(n => n.estado?.toLowerCase() === 'ocupado' || n.estado?.toLowerCase().includes('ocup')).length;
            const mant = adminData.filter(n => n.estado?.toLowerCase() === 'mantenimiento' || n.estado?.toLowerCase().includes('mant')).length;
            const disp = adminData.filter(n => n.socio_id === null && n.estado?.toLowerCase() !== 'mantenimiento').length;

            console.log('\nRESUMEN:');
            console.log(`  Total: ${adminData.length}`);
            console.log(`  Ocupados: ${ocup}`);
            console.log(`  Mantenimiento: ${mant}`);
            console.log(`  Disponibles: ${disp}`);
        }
    }
}

testEspacioVerde().catch(console.error);
