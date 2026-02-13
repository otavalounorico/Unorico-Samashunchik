const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarNichosIncorrectos() {
    console.log('=== VERIFICAR NICHOS CON bloques_geom_id INCORRECTO ===\n');

    // Buscar nichos donde el prefijo del código NO coincida con bloques_geom_id
    const { data: nichos } = await supabase
        .from('nichos_geom')
        .select('id, codigo, bloques_geom_id')
        .limit(1000);

    const incorrectos = [];
    nichos?.forEach(n => {
        const match = n.codigo?.match(/^B(\d+)-/);
        if (match) {
            const prefijoId = parseInt(match[1]);
            if (prefijoId !== n.bloques_geom_id) {
                incorrectos.push({
                    codigo: n.codigo,
                    prefijo: `B${prefijoId}`,
                    bloques_geom_id_actual: n.bloques_geom_id,
                    deberia_ser: prefijoId
                });
            }
        }
    });

    console.log(`Total nichos revisados: ${nichos?.length}`);
    console.log(`Nichos con bloques_geom_id INCORRECTO: ${incorrectos.length}\n`);

    if (incorrectos.length > 0) {
        console.log('EJEMPLOS DE NICHOS INCORRECTOS (primeros 10):');
        console.table(incorrectos.slice(0, 10));
    } else {
        console.log('✓ TODOS los nichos tienen bloques_geom_id correcto!');
    }
}

verificarNichosIncorrectos().catch(console.error);
