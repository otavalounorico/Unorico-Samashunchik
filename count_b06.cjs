const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function contarTodosGenesisB06() {
    console.log('=== CONTEO COMPLETO BLOQUE B-06 (bloques_geom_id=2) ===\n');

    // Obtener TODOS los nichos del bloque (sin limit)
    const { data: todosNichos } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado')
        .eq('bloques_geom_id', 2);

    console.log(`Total nichos en bloque: ${todosNichos?.length || 0}\n`);

    if (todosNichos) {
        const ocupados = todosNichos.filter(n => n.estado?.toUpperCase() === 'OCUPADO');
        const mant = todosNichos.filter(n => n.estado?.toUpperCase() === 'MANTENIMIENTO');
        const disp = todosNichos.filter(n => n.estado?.toUpperCase() === 'DISPONIBLE');

        console.log('OCUPADOS:');
        console.table(ocupados);

        console.log('\nMANTENIMIENTO:');
        console.table(mant);

        console.log('\nRESUMEN:');
        console.log(`Total: ${todosNichos.length}`);
        console.log(`Ocupados: ${ocupados.length}`);
        console.log(`Mantenimiento: ${mant.length}`);
        console.log(`Disponibles: ${disp.length}`);
    }
}

contarTodosGenesisB06().catch(console.error);
