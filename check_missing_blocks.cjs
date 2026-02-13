const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBloquesExistentes() {
    console.log('=== BLOQUES QUE NECESITAN EXISTIR ===\n');

    // Obtener todos los prefijos únicos de nichos
    const { data: nichos } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .limit(2000);

    const prefijos = new Set();
    nichos?.forEach(n => {
        const match = n.codigo?.match(/^B(\d+)-/);
        if (match) {
            prefijos.add(parseInt(match[1]));
        }
    });

    console.log('IDs necesarios según códigos de nichos:');
    console.log(Array.from(prefijos).sort((a, b) => a - b).slice(0, 20).join(', '));

    // Verificar cuáles existen en bloques_geom
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre');

    const idsExistentes = new Set(bloques?.map(b => b.id));

    const faltantes = Array.from(prefijos).filter(id => !idsExistentes.has(id));

    console.log(`\nIDs que FALTAN en bloques_geom: ${faltantes.length}`);
    if (faltantes.length > 0) {
        console.log('Ejemplos:', faltantes.sort((a, b) => a - b).slice(0, 10).join(', '));
    }
}

verificarBloquesExistentes().catch(console.error);
