const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseData() {
    console.log('=== DIAGNÓSTICO DE TABLAS ===\n');

    // 1. Verificar estructura de nichos
    console.log('1. TABLA NICHOS - Primeros 5 registros del sector BAÑOS:');
    const { data: nichosData, error: nichosError } = await supabase
        .from('nichos')
        .select('codigo, estado, disponible, socio_id, bloque_id')
        .ilike('codigo', 'B-%')
        .limit(5);

    if (nichosError) {
        console.log('Error:', nichosError);
    } else {
        console.log('Registros encontrados:', nichosData?.length || 0);
        console.table(nichosData);
    }

    // 2. Verificar estructura de nichos_geom
    console.log('\n2. TABLA NICHOS_GEOM - Primeros 5 registros del sector BAÑOS:');
    const { data: geomData, error: geomError } = await supabase
        .from('nichos_geom')
        .select('codigo, estado, socio_id, bloques_geom_id')
        .ilike('codigo', 'B-%')
        .limit(5);

    if (geomError) {
        console.log('Error:', geomError);
    } else {
        console.log('Registros encontrados:', geomData?.length || 0);
        console.table(geomData);
    }

    // 3. Verificar bloques_geom para el sector BAÑOS
    console.log('\n3. TABLA BLOQUES_GEOM - Bloques del sector BAÑOS:');
    const { data: bloquesData, error: bloquesError } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('sector', 'BAÑOS')
        .limit(5);

    if (bloquesError) {
        console.log('Error:', bloquesError);
    } else {
        console.log('Bloques encontrados:', bloquesData?.length || 0);
        console.table(bloquesData);

        // Si encontramos bloques, probemos buscar nichos asociados
        if (bloquesData && bloquesData.length > 0) {
            const primerBloque = bloquesData[0];
            console.log(`\n4. Probando búsqueda de nichos para bloque: ${primerBloque.codigo} (${primerBloque.nombre}), ID: ${primerBloque.id}`);

            // Intentar por bloques_geom_id en nichos_geom (seleccionando todas las columnas)
            const { data: nichosPorId } = await supabase
                .from('nichos_geom')
                .select('*')
                .eq('bloques_geom_id', primerBloque.id)
                .limit(3);
            console.log(`   - Por bloques_geom_id=${primerBloque.id} en nichos_geom: ${nichosPorId?.length || 0} nichos`);
            if (nichosPorId && nichosPorId.length > 0) {
                console.log('     Columnas disponibles:', Object.keys(nichosPorId[0]));
                console.table(nichosPorId);
            }

            // Intentar por patrón de código en nichos (todas las columnas)
            const { data: nichosPorCodigo } = await supabase
                .from('nichos')
                .select('*')
                .ilike('codigo', `${primerBloque.codigo}-%`)
                .limit(3);
            console.log(`   - Por patrón ${primerBloque.codigo}-% en nichos: ${nichosPorCodigo?.length || 0} nichos`);
            if (nichosPorCodigo && nichosPorCodigo.length > 0) {
                console.log('     Columnas disponibles:', Object.keys(nichosPorCodigo[0]));
                console.table(nichosPorCodigo);
            }
        }
    }
}

diagnoseData().catch(console.error);
