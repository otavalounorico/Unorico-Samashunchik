const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarProblemas() {
    console.log('=== PROBLEMA 1: BLOQUE ID=1 ===\n');

    const { data: bloque1 } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('id', 1)
        .single();

    console.table([bloque1]);

    console.log('\n=== PROBLEMA 2: NICHO B5-NB059 ===\n');

    const { data: nichoB5 } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id')
        .eq('codigo', 'B5-NB059')
        .single();

    console.log('Nicho B5-NB059:', nichoB5);

    if (nichoB5) {
        const { data: bloque } = await supabase
            .from('bloques_geom')
            .select('*')
            .eq('id', nichoB5.bloques_geom_id)
            .single();

        console.log('\nBloque asignado:');
        console.table([bloque]);
    }

    // Ver todos los nichos B5-*
    const { data: nichosB5, count } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id', { count: 'exact' })
        .ilike('codigo', 'B5-%')
        .limit(5);

    console.log(`\nTotal nichos B5-*: ${count}`);
    console.log('Ejemplos:');
    console.table(nichosB5);
}

investigarProblemas().catch(console.error);
