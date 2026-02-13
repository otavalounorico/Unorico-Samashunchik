const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function encontrarBloqueCapillaB01() {
    console.log('=== BUSCANDO BLOQUE 01 EN CAPILLA ===\n');

    // Buscar bloques geométricos en sector CAPILLA
    const { data: bloquesCapilla } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('sector', 'CAPILLA');

    console.log('Bloques en CAPILLA:');
    console.table(bloquesCapilla);

    // Buscar específicamente el bloque B-01
    const bloqueB01 = bloquesCapilla?.find(b =>
        b.codigo === 'B-01' || b.nombre?.includes('Bloque 01') || b.nombre?.includes('Bloque 1')
    );

    if (bloqueB01) {
        console.log('\n✓ Encontrado Bloque 01:');
        console.log(`  ID: ${bloqueB01.id}`);
        console.log(`  Código: ${bloqueB01.codigo}`);
        console.log(`  Nombre: ${bloqueB01.nombre}`);

        // Buscar nichos disponibles en ese bloque
        const { data: nichosDisponibles } = await supabase
            .from('nichos_geom')
            .select('id, codigo, estado')
            .eq('bloques_geom_id', bloqueB01.id)
            .eq('estado', 'DISPONIBLE')
            .limit(5);

        console.log(`\nNichos disponibles en Bloque 01 (primeros 5):`);
        console.table(nichosDisponibles);

        if (nichosDisponibles && nichosDisponibles.length > 0) {
            console.log(`\n✓ Hay ${nichosDisponibles.length} nichos disponibles`);
            console.log(`  Sugerencia: Usar nicho_geom_id = ${nichosDisponibles[0].id} (${nichosDisponibles[0].codigo})`);
        }
    } else {
        console.log('\n✗ No se encontró el Bloque 01 en CAPILLA');
    }
}

encontrarBloqueCapillaB01().catch(console.error);
