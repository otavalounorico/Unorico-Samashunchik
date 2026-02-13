const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function mapearCapilla() {
    console.log('=== MAPEANDO SECTOR CAPILLA ===\n');

    // Obtener todos los bloques del sector CAPILLA
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .ilike('sector', '%CAPILLA%')
        .order('nombre');

    console.table(bloques);

    console.log('\n=== ANALIZANDO PREFIJOS DE NICHOS ACTUALES ===');
    // Ver dónde están asignados actualmente los nichos B1, B2, B3...
    const prefijos = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

    for (const p of prefijos) {
        const { data, count } = await supabase
            .from('nichos_geom')
            .select('bloques_geom_id', { count: 'exact', head: false })
            .ilike('codigo', `${p}-%`)
            .limit(1);

        if (count > 0) {
            const bgId = data[0].bloques_geom_id;
            // Buscar info del bloque asignado actual
            const { data: bInfo } = await supabase.from('bloques_geom').select('nombre, sector').eq('id', bgId).single();
            console.log(`Nichos ${p}-* (${count}) -> ID ${bgId} [${bInfo?.nombre} - ${bInfo?.sector}]`);
        } else {
            console.log(`Nichos ${p}-* -> 0 encontrados`);
        }
    }
}

mapearCapilla().catch(console.error);
