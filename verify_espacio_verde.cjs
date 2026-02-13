const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEspacioVerde() {
    console.log('=== VERIFICAR ESPACIO VERDE ===\n');

    // Buscar Espacio Verde
    const { data: espacioVerde } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('codigo', 'EV-20')
        .single();

    console.log('Espacio Verde:');
    console.table([{
        id: espacioVerde?.id,
        codigo: espacioVerde?.codigo,
        nombre: espacioVerde?.nombre,
        sector: espacioVerde?.sector
    }]);

    // Verificar si hay nichos en ID=1
    const { count: nichosEn1 } = await supabase
        .from('nichos_geom')
        .select('id', { count: 'exact', head: true })
        .eq('bloques_geom_id', 1);

    console.log(`\nNichos en bloques_geom_id=1: ${nichosEn1}`);

    // Verificar si hay nichos en ID=100
    const { count: nichosEn100 } = await supabase
        .from('nichos_geom')
        .select('id', { count: 'exact', head: true })
        .eq('bloques_geom_id', 100);

    console.log(`Nichos en bloques_geom_id=100: ${nichosEn100}`);

    // Verificar Bloque 01 CAPILLA
    const { data: bloque01, count: nichosBloque01 } = await supabase
        .from('nichos_geom')
        .select('codigo', { count: 'exact' })
        .eq('bloques_geom_id', 8)
        .limit(5);

    console.log(`\nBloque 01 CAPILLA (ID=8): ${nichosBloque01} nichos`);
    console.log('Ejemplos:', bloque01?.map(n => n.codigo).join(', '));

    // Ver si hay nichos con código B1-*
    const { data: nichosB1, count: countB1 } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id', { count: 'exact' })
        .ilike('codigo', 'B1-%')
        .limit(5);

    console.log(`\nNichos con código B1-*: ${countB1}`);
    if (nichosB1 && nichosB1.length > 0) {
        console.table(nichosB1);
    }
}

verificarEspacioVerde().catch(console.error);
