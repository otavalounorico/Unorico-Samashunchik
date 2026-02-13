const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarNichosB02() {
    console.log('=== INVESTIGAR NICHOS DEL BLOQUE B-02 ===\n');

    // 1. Buscar TODOS los nichos que tengan códigos que parezcan del bloque B-02
    // Pueden tener varios formatos: B-02-*, B02-*, B2-*, etc.
    const { data: todosBloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector');

    console.log('TODOS LOS BLOQUES:');
    console.table(todosBloques?.map(b => ({ id: b.id, codigo: b.codigo, nombre: b.nombre, sector: b.sector })));

    // 2. Buscar nichos con diferentes patrones que podrían ser del Bloque 02
    const patrones = [
        'B-02-%',
        'B02-%',
        'B2-%',
        '%B-02%',
        '%B02%'
    ];

    console.log('\nBUSCANDO NICHOS CON PATRONES RELACIONADOS A B-02:');

    for (const patron of patrones) {
        const { data: nichos } = await supabase
            .from('nichos_geom')
            .select('id, codigo, bloques_geom_id')
            .ilike('codigo', patron)
            .limit(5);

        if (nichos && nichos.length > 0) {
            console.log(`\nPatrón "${patron}": ${nichos.length} encontrados (mostrando primeros 5)`);
            console.table(nichos);
        }
    }

    // 3. Agrupar todos los nichos por bloques_geom_id
    console.log('\n=== CONTEO DE NICHOS POR BLOQUES_GEOM_ID ===');
    const { data: todosNichos } = await supabase
        .from('nichos_geom')
        .select('bloques_geom_id');

    const conteo = {};
    todosNichos?.forEach(n => {
        const id = n.bloques_geom_id || 'NULL';
        conteo[id] = (conteo[id] || 0) + 1;
    });

    console.log('\nNichos por bloques_geom_id:');
    Object.entries(conteo).forEach(([bloque_id, count]) => {
        const bloque = todosBloques?.find(b => b.id == bloque_id);
        console.log(`  Bloque ${bloque_id} (${bloque?.codigo || 'desconocido'}): ${count} nichos`);
    });
}

investigarNichosB02().catch(console.error);
