const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBloqueID57() {
    console.log('=== BLOQUE ID 57 ===\n');

    // Info del bloque
    const { data: bloque } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('id', 57)
        .single();

    console.log('INFO DEL BLOQUE:');
    console.table([{
        id: bloque?.id,
        codigo: bloque?.codigo,
        nombre: bloque?.nombre,
        sector: bloque?.sector
    }]);

    // Nichos vinculados por bloques_geom_id
    const { data: nichosPorId, count: countPorId } = await supabase
        .from('nichos_geom')
        .select('id, codigo', { count: 'exact' })
        .eq('bloques_geom_id', 57)
        .limit(10);

    console.log(`\nNichos con bloques_geom_id=57: ${countPorId} total`);
    console.log('Primeros 10:');
    console.table(nichosPorId);

    // Verificar qué patrón de código usan
    if (nichosPorId && nichosPorId.length > 0) {
        const primerCodigo = nichosPorId[0].codigo;
        console.log(`\nPrimer código: ${primerCodigo}`);
        console.log('Patrón detectado:', primerCodigo?.match(/^[^-]+-/)?.[0]);
    }
}

verificarBloqueID57().catch(console.error);
