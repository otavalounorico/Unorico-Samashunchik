const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simularReporteCAPILLA() {
    console.log('=== SIMULACIÓN DEL REPORTE PARA CAPILLA ===\n');

    // Paso 1: Obtener bloques_geom de CAPILLA
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('sector', 'CAPILLA')
        .order('codigo');

    console.log('Bloques encontrados:');
    console.table(bloques);

    // Paso 2: Para cada bloque, contar nichos
    console.log('\n=== CONTEO DE NICHOS ===\n');
    for (const bloque of bloques || []) {
        if (bloque.codigo === 'EV-20') continue; // Saltar espacio verde

        const { count } = await supabase
            .from('nichos_geom')
            .select('id', { count: 'exact', head: true })
            .eq('bloques_geom_id', bloque.id);

        console.log(`${bloque.codigo} (${bloque.nombre}) - bloques_geom_id=${bloque.id}: ${count} nichos`);
    }
}

simularReporteCAPILLA().catch(console.error);
