const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarID8() {
    console.log('=== VERIFICAR ID 1 Y ID 8 ===\n');

    // Ver ID 1
    const { data: bloque1 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('id', 1)
        .single();

    console.log('ID 1:');
    console.table([bloque1]);

    // Ver ID 8
    const { data: bloque8 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('id', 8)
        .single();

    console.log('\nID 8:');
    console.table([bloque8]);

    // Ver qué nichos tiene cada uno
    const { data: nichosId1 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 1);

    const { data: nichosId8 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 8);

    console.log(`\nID 1 tiene ${nichosId1?.length || 0} nichos`);
    if (nichosId1 && nichosId1.length > 0) {
        const prefijos = new Set(nichosId1.map(n => n.codigo.split('-')[0]));
        console.log(`  Prefijos: ${Array.from(prefijos).join(', ')}`);
    }

    console.log(`\nID 8 tiene ${nichosId8?.length || 0} nichos`);
    if (nichosId8 && nichosId8.length > 0) {
        const prefijos = new Set(nichosId8.map(n => n.codigo.split('-')[0]));
        console.log(`  Prefijos: ${Array.from(prefijos).join(', ')}`);
    }
}

verificarID8().catch(console.error);
