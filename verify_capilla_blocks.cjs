const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBloquesCAPILLA() {
    console.log('=== VERIFICAR BLOQUES DE CAPILLA ===\n');

    // 1. Obtener todos los bloques de CAPILLA
    const { data: bloquesCapilla } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('sector', 'CAPILLA')
        .order('codigo');

    console.log('BLOQUES EN CAPILLA:');
    console.table(bloquesCapilla?.map(b => ({
        id: b.id,
        codigo: b.codigo,
        nombre: b.nombre
    })));

    // 2. Contar nichos por cada bloque
    console.log('\nCONTEO DE NICHOS POR BLOQUE:');
    for (const bloque of bloquesCapilla || []) {
        const { data: nichos, count } = await supabase
            .from('nichos_geom')
            .select('id', { count: 'exact', head: true })
            .eq('bloques_geom_id', bloque.id);

        console.log(`${bloque.codigo} (${bloque.nombre}) - ID: ${bloque.id} → ${count} nichos`);
    }

    // 3. Ver qué bloques están siendo seleccionados en el reporte
    console.log('\n¿QUÉ BLOQUES ESTÁ SELECCIONANDO EL USUARIO?');
    console.log('Si seleccionó B-01, B-02, B-03, estos son sus IDs:');
    const b01 = bloquesCapilla?.find(b => b.codigo === 'B-01');
    const b02 = bloquesCapilla?.find(b => b.codigo === 'B-02');
    const b03 = bloquesCapilla?.find(b => b.codigo === 'B-03');

    console.log(`B-01 → ID: ${b01?.id}`);
    console.log(`B-02 → ID: ${b02?.id}`);
    console.log(`B-03 → ID: ${b03?.id}`);
}

verificarBloquesCAPILLA().catch(console.error);
