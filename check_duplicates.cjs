const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarDuplicados() {
    console.log('=== INVESTIGAR NICHOS B1 vs B8 ===\n');

    // Nichos en bloques_geom_id=1 (Espacio Verde)
    const { data: nichosB1Geom } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 1);

    // Nichos en bloques_geom_id=8 (Bloque 01 CAPILLA)
    const { data: nichosB8Geom } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 8);

    console.log(`Nichos en bloques_geom_id=1: ${nichosB1Geom?.length}`);
    console.log(`Nichos en bloques_geom_id=8: ${nichosB8Geom?.length}\n`);

    // Ver prefijos de códigos
    const prefijosB1 = new Set(nichosB1Geom?.map(n => n.codigo?.match(/^[^-]+/)?.[0]));
    const prefijosB8 = new Set(nichosB8Geom?.map(n => n.codigo?.match(/^[^-]+/)?.[0]));

    console.log('Prefijos en bloques_geom_id=1:', Array.from(prefijosB1).join(', '));
    console.log('Prefijos en bloques_geom_id=8:', Array.from(prefijosB8).join(', '));

    // Verificar si hay códigos duplicados
    const codigosB1 = new Set(nichosB1Geom?.map(n => n.codigo));
    const codigosB8 = new Set(nichosB8Geom?.map(n => n.codigo));

    const duplicados = [...codigosB1].filter(c => codigosB8.has(c));

    console.log(`\nCódigos duplicados entre ambos bloques: ${duplicados.length}`);
    if (duplicados.length > 0) {
        console.log('Ejemplos:', duplicados.slice(0, 5).join(', '));
    }

    // Total único
    const todosLosCodigos = new Set([...codigosB1, ...codigosB8]);
    console.log(`\nTotal nichos únicos: ${todosLosCodigos.size}`);
}

investigarDuplicados().catch(console.error);
