const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarMezcla() {
    console.log('=== VERIFICAR SI B1 Y B8 SE MEZCLARÁN ===\n');

    // 1. ¿Dónde están los nichos B1 ahora?
    const { data: nichosB1 } = await supabase
        .from('nichos_geom')
        .select('bloques_geom_id')
        .ilike('codigo', 'B1-%')
        .limit(1);

    if (nichosB1 && nichosB1.length > 0) {
        const { data: bloqueB1 } = await supabase
            .from('bloques_geom')
            .select('id, codigo, nombre, sector')
            .eq('id', nichosB1[0].bloques_geom_id)
            .single();

        console.log('Nichos B1-* están en:');
        console.table([bloqueB1]);
    }

    // 2. ¿Dónde están los nichos B8 ahora?
    const { data: nichosB8, count: countB8 } = await supabase
        .from('nichos_geom')
        .select('bloques_geom_id', { count: 'exact' })
        .ilike('codigo', 'B8-%')
        .limit(1);

    console.log(`\nTotal nichos B8: ${countB8}`);

    if (nichosB8 && nichosB8.length > 0) {
        const { data: bloqueB8 } = await supabase
            .from('bloques_geom')
            .select('id, codigo, nombre, sector')
            .eq('id', nichosB8[0].bloques_geom_id)
            .single();

        console.log('Nichos B8-* están en:');
        console.table([bloqueB8]);
    }

    // 3. ¿Qué bloques tienen código B-01?
    const { data: bloquesConB01 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('codigo', 'B-01');

    console.log('\nBloques con código B-01:');
    console.table(bloquesConB01);

    // 4. ¿Qué bloques tienen código B-08?
    const { data: bloquesConB08 } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('codigo', 'B-08');

    console.log('\nBloques con código B-08:');
    console.table(bloquesConB08);

    console.log('\n=== PREDICCIÓN ===');
    console.log('El script moverá:');
    console.log(`  - Nichos B1-* → Bloque con código B-01 (ID ${bloquesConB01?.[0]?.id})`);
    console.log(`  - Nichos B8-* → Bloque con código B-08 (ID ${bloquesConB08?.[0]?.id})`);

    if (bloquesConB01?.[0]?.id === bloquesConB08?.[0]?.id) {
        console.log('\n⚠️ ALERTA: ¡SE MEZCLARÁN! Ambos irán al mismo ID.');
    } else {
        console.log('\n✅ OK: Irán a bloques diferentes.');
    }
}

verificarMezcla().catch(console.error);
