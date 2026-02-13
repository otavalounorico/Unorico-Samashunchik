const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstadosNichosGeom() {
    console.log('=== ESTADOS EN nichos_geom ===\n');

    // Contar por cada estado
    const { data: todosNichos } = await supabase
        .from('nichos_geom')
        .select('estado');

    const conteo = {};
    todosNichos?.forEach(n => {
        const estado = n.estado || 'NULL';
        conteo[estado] = (conteo[estado] || 0) + 1;
    });

    console.log('DISTRIBUCIÓN DE ESTADOS:');
    console.table(conteo);

    console.log('\nTOTAL:', todosNichos?.length);
}

verificarEstadosNichosGeom().catch(console.error);
