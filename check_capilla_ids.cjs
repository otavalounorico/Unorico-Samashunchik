const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBloquesCAPILLA() {
    console.log('=== BLOQUES DE CAPILLA CON SUS IDs ===\n');

    const { data: bloquesCAPILLA } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('sector', 'CAPILLA')
        .order('nombre');

    console.log('BLOQUES:');
    console.table(bloquesCAPILLA?.map(b => ({
        id: b.id,
        codigo: b.codigo,
        nombre: b.nombre,
        area: b.area
    })));

    console.log('\n=== CONTEO DE NICHOS POR BLOQUE ===\n');

    for (const bloque of bloquesCAPILLA || []) {
        const { count } = await supabase
            .from('nichos_geom')
            .select('id', { count: 'exact', head: true })
            .eq('bloques_geom_id', bloque.id);

        console.log(`Bloque ID ${bloque.id} (${bloque.codigo} - ${bloque.nombre}): ${count} nichos`);
    }
}

verificarBloquesCAPILLA().catch(console.error);
