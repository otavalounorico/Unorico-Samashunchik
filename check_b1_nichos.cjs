const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarNichosB1() {
    console.log('=== NICHOS B1-* ===\n');

    // Buscar todos los nichos B1-*
    const { data: nichosB1, count } = await supabase
        .from('nichos_geom')
        .select('id, codigo, bloques_geom_id', { count: 'exact' })
        .ilike('codigo', 'B1-%');

    console.log(`Total nichos con código B1-*: ${count}\n`);

    // Ver a qué bloques_geom_id están vinculados
    const agrupados = {};
    nichosB1?.forEach(n => {
        if (!agrupados[n.bloques_geom_id]) {
            agrupados[n.bloques_geom_id] = 0;
        }
        agrupados[n.bloques_geom_id]++;
    });

    console.log('Distribución por bloques_geom_id:');
    for (const [id, cant] of Object.entries(agrupados)) {
        const { data: bloque } = await supabase
            .from('bloques_geom')
            .select('codigo, nombre, sector')
            .eq('id', id)
            .single();

        console.log(`  ID ${id}: ${cant} nichos → ${bloque?.codigo} "${bloque?.nombre}" (${bloque?.sector})`);
    }

    console.log('\n=== BLOQUES CAPILLA ===\n');

    // Ver bloques de CAPILLA
    const { data: bloquesCAPILLA } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre')
        .eq('sector', 'CAPILLA');

    console.table(bloquesCAPILLA);
}

verificarNichosB1().catch(console.error);
