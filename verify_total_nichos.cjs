const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTotalNichos() {
    console.log('=== VERIFICACIÓN TOTAL DE NICHOS ===\n');

    // Contar total de nichos
    const { count: totalNichos } = await supabase
        .from('nichos_geom')
        .select('*', { count: 'exact', head: true });

    console.log(`Total nichos en nichos_geom: ${totalNichos}\n`);

    // Contar nichos por bloques_geom_id para CAPILLA
    const { data: bloquesCAPILLA } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre')
        .eq('sector', 'CAPILLA')
        .order('codigo');

    console.log('NICHOS POR BLOQUE EN CAPILLA:');
    let totalCapilla = 0;
    for (const bloque of bloquesCAPILLA || []) {
        const { count } = await supabase
            .from('nichos_geom')
            .select('*', { count: 'exact', head: true })
            .eq('bloques_geom_id', bloque.id);

        console.log(`  ${bloque.codigo} (${bloque.nombre}) - ID:${bloque.id}: ${count} nichos`);
        totalCapilla += count || 0;
    }
    console.log(`\nTotal CAPILLA: ${totalCapilla} nichos`);

    // Buscar nichos sin bloques_geom_id asignado
    const { count: sinBloque } = await supabase
        .from('nichos_geom')
        .select('*', { count: 'exact', head: true })
        .is('bloques_geom_id', null);

    console.log(`\nNichos SIN bloques_geom_id: ${sinBloque}`);
}

verificarTotalNichos().catch(console.error);
