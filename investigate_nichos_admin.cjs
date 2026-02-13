const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarTablaNichos() {
    console.log('=== INVESTIGAR TABLA NICHOS (Administrativa) ===\n');

    // Ver algunos registros de ejemplo
    const { data: ejemplos } = await supabase
        .from('nichos')
        .select('*')
        .limit(5);

    console.log('Ejemplos de nichos administrativos:');
    console.table(ejemplos);

    // Verificar si hay nichos con estado
    const { data: conEstado, count } = await supabase
        .from('nichos')
        .select('codigo, estado, bloques_geom_id', { count: 'exact' })
        .not('estado', 'is', null)
        .limit(5);

    console.log(`\nNichos con estado definido: ${count}`);
    console.table(conEstado);

    // Ver estados únicos
    const { data: todosNichos } = await supabase
        .from('nichos')
        .select('estado');

    const estadosUnicos = new Set(todosNichos?.map(n => n.estado).filter(e => e));
    console.log('\nEstados únicos encontrados:', Array.from(estadosUnicos));
}

investigarTablaNichos().catch(console.error);
