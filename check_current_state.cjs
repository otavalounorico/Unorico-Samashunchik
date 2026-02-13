const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstadoActual() {
    console.log('=== VERIFICANDO ESTADO DE BLOQUES ===\n');

    // 1. Ver Espacio Verde
    const { data: ev } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .ilike('nombre', '%verde%');

    console.log('Espacio Verde encontrado:');
    console.table(ev);

    // 2. Ver Bloque 01
    const { data: b1 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .ilike('nombre', '%Bloque 01%');

    console.log('\nBloque 01 encontrado:');
    console.table(b1);

    // 3. Ver Bloque ID=1 (si existe)
    const { data: bid1 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('id', 1);

    console.log('\nBloque con ID=1:');
    console.table(bid1);

    console.log('\n=== VERIFICANDO NICHO B1-NA15 ===\n');

    // 4. Ver nicho específico
    const { data: nicho } = await supabase
        .from('nichos_geom')
        .select('id, codigo, bloques_geom_id')
        .eq('codigo', 'B1-NA15')
        .single();

    console.log('Nicho B1-NA15:', nicho);

    if (nicho) {
        const { data: bAsignado } = await supabase
            .from('bloques_geom')
            .select('id, nombre, sector')
            .eq('id', nicho.bloques_geom_id)
            .single();

        console.log('Bloque asignado al nicho:', bAsignado);
    }
}

verificarEstadoActual().catch(console.error);
