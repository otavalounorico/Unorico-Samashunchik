const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarNichosEspacioVerde() {
    console.log('=== NICHOS EN ESPACIO VERDE (bloques_geom_id=1) ===\n');

    const { data: nichos, count } = await supabase
        .from('nichos_geom')
        .select('id, codigo, bloques_geom_id', { count: 'exact' })
        .eq('bloques_geom_id', 1);

    console.log(`Total nichos en Espacio Verde: ${count}\n`);

    if (nichos && nichos.length > 0) {
        // Analizar patrones
        const conPatron = nichos.filter(n => /^B\d+-/.test(n.codigo));
        const sinPatron = nichos.filter(n => !/^B\d+-/.test(n.codigo));

        console.log(`Con patrón B{num}-: ${conPatron.length}`);
        console.log(`Sin patrón: ${sinPatron.length}\n`);

        if (conPatron.length > 0) {
            console.log('Ejemplos CON patrón (primeros 10):');
            console.table(conPatron.slice(0, 10).map(n => ({
                codigo: n.codigo,
                deberia_ser: n.codigo.match(/^B(\d+)-/)?.[1]
            })));
        }

        if (sinPatron.length > 0) {
            console.log('\nEjemplos SIN patrón (primeros 10):');
            console.table(sinPatron.slice(0, 10));
        }
    } else {
        console.log('✓ No hay nichos en el Espacio Verde. Se puede cambiar el ID.');
    }
}

verificarNichosEspacioVerde().catch(console.error);
