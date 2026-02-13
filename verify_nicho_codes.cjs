const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarCodigosNichos() {
    console.log('=== VERIFICAR CÓDIGOS DE NICHOS DEL BLOQUE B-02 ===\n');

    // Buscar nichos con código B2-*
    const { data: nichosB2, count: countB2 } = await supabase
        .from('nichos_geom')
        .select('id, codigo, bloques_geom_id', { count: 'exact' })
        .ilike('codigo', 'B2-%')
        .order('codigo')
        .limit(10);

    console.log(`Nichos con código B2-*: ${countB2} total`);
    console.log('Primeros 10:');
    console.table(nichosB2);

    // Verificar qué bloques_geom_id tienen
    if (nichosB2 && nichosB2.length > 0) {
        const bloqueIds = [...new Set(nichosB2.map(n => n.bloques_geom_id))];
        console.log(`\nEstos nichos están en bloques_geom_id: ${bloqueIds.join(', ')}`);

        for (const id of bloqueIds) {
            const { data: bloque } = await supabase
                .from('bloques_geom')
                .select('codigo, nombre, sector')
                .eq('id', id)
                .single();

            console.log(`  ID ${id}: ${bloque?.codigo} - ${bloque?.nombre} (${bloque?.sector})`);
        }
    }
}

verificarCodigosNichos().catch(console.error);
