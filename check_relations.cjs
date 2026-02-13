const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelations() {
    console.log('=== VERIFICACIÓN DE RELACIONES ===\n');

    // 1. ¿Hay datos en nichos?
    console.log('1. TABLA NICHOS - Total de registros:');
    const { count: nichosCount } = await supabase
        .from('nichos')
        .select('*', { count: 'exact', head: true });
    console.log(`   Total nichos: ${nichosCount || 0}`);

    // 2. Muestra de nichos (primeros 5)
    const { data: nichosSample } = await supabase
        .from('nichos')
        .select('id, codigo, socio_id, bloque_id, nicho_geom_id, estado, disponible')
        .limit(5);
    console.log('\n2. Muestra de nichos:');
    console.table(nichosSample);

    // 3. Tabla bloques - Total
    console.log('\n3. TABLA BLOQUES:');
    const { count: bloquesCount } = await supabase
        .from('bloques')
        .select('*', { count: 'exact', head: true });
    console.log(`   Total bloques: ${bloquesCount || 0}`);

    const { data: bloquesSample } = await supabase
        .from('bloques')
        .select('id, codigo, nombre, bloque_geom_id')
        .limit(5);
    console.table(bloquesSample);

    // 4. Verificar nichos del sector BAÑOS usando JOIN
    console.log('\n4. NICHOS del sector BAÑOS (intentando con JOIN):');

    // Primero obtenemos los IDs de bloques del sector BAÑOS
    const { data: bloquesBanos } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre')
        .eq('sector', 'BAÑOS');

    if (bloquesBanos && bloquesBanos.length > 0) {
        console.log(`   Bloques_geom en BAÑOS: ${bloquesBanos.length}`);
        console.table(bloquesBanos);

        // Ahora buscamos los bloques lógicos que apuntan a estos bloques_geom
        const bloqueGeomIds = bloquesBanos.map(b => b.id);
        const { data: bloquesLogicos } = await supabase
            .from('bloques')
            .select('id, codigo, nombre, bloque_geom_id')
            .in('bloque_geom_id', bloqueGeomIds);

        console.log(`\n   Bloques lógicos vinculados: ${bloquesLogicos?.length || 0}`);
        console.table(bloquesLogicos);

        if (bloquesLogicos && bloquesLogicos.length > 0) {
            // Ahora buscamos nichos que pertenecen a estos bloques
            const bloqueIds = bloquesLogicos.map(b => b.id);
            const { data: nichosDelSector } = await supabase
                .from('nichos')
                .select('id, codigo, socio_id, bloque_id, estado, disponible')
                .in('bloque_id', bloqueIds)
                .limit(5);

            console.log(`\n   Nichos encontrados en sector BAÑOS: ${nichosDelSector?.length || 0}`);
            console.table(nichosDelSector);
        }
    }
}

checkRelations().catch(console.error);
