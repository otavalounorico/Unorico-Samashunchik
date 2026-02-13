const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDistribucion() {
    console.log('=== DISTRIBUCIÓN DE NICHOS POR ID DE BLOQUE ===\n');

    // ID 1 (Espacio Verde)
    const { data: nichos1 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 1);

    console.log(`ID 1 (Actual Espacio Verde): ${nichos1?.length} nichos`);
    if (nichos1?.length > 0) {
        const prefijos = new Set(nichos1.map(n => n.codigo.split('-')[0]));
        console.log(`  Prefijos: ${Array.from(prefijos).join(', ')}`);
    }

    // ID 8 (Actual Bloque 01)
    const { data: nichos8 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 8);

    console.log(`\nID 8 (Actual Bloque 01): ${nichos8?.length} nichos`);
    if (nichos8?.length > 0) {
        const prefijos = new Set(nichos8.map(n => n.codigo.split('-')[0]));
        console.log(`  Prefijos: ${Array.from(prefijos).join(', ')}`);
    }
}

verificarDistribucion().catch(console.error);
