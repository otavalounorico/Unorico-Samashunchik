const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarRelacion() {
    console.log('=== INVESTIGAR RELACIÓN BLOQUES ===\n');

    // Ver tabla bloques
    const { data: bloques } = await supabase
        .from('bloques')
        .select('*')
        .limit(5);

    console.log('Ejemplos de tabla "bloques":');
    console.table(bloques);

    // Ver cómo relacionar nichos -> bloques -> bloques_geom
    console.log('\n=== ESTRATEGIA DE RELACIÓN ===');
    console.log('nichos.bloque_id -> bloques.id');
    console.log('bloques.bloques_geom_id -> bloques_geom.id');
}

investigarRelacion().catch(console.error);
