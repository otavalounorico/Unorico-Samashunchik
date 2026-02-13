const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analizarTodosLosPatrones() {
    console.log('=== ANÁLISIS DE TODOS LOS PATRONES DE CÓDIGOS ===\n');

    // Obtener TODOS los bloques
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('id');

    console.log(`Total bloques: ${bloques?.length}\n`);

    // Para cada bloque, analizar qué nichos le pertenecen
    const resultados = [];

    for (const bloque of bloques || []) {
        // Nichos por bloques_geom_id
        const { data: nichosPorId } = await supabase
            .from('nichos_geom')
            .select('codigo')
            .eq('bloques_geom_id', bloque.id)
            .limit(3);

        if (nichosPorId && nichosPorId.length > 0) {
            const prefijos = nichosPorId.map(n => {
                const match = n.codigo?.match(/^([^-]+)-/);
                return match ? match[1] : n.codigo;
            });

            resultados.push({
                bloques_geom_id: bloque.id,
                codigo_bloque: bloque.codigo,
                nombre: bloque.nombre,
                sector: bloque.sector,
                prefijos_nichos: [...new Set(prefijos)].join(', '),
                ejemplo: nichosPorId[0]?.codigo
            });
        }
    }

    console.log('RELACIÓN BLOQUES → PREFIJOS DE NICHOS:');
    console.table(resultados.slice(0, 20)); // Primeros 20

    // Identificar patrones únicos
    const todosLosPrefijos = new Set();
    resultados.forEach(r => {
        r.prefijos_nichos.split(', ').forEach(p => todosLosPrefijos.add(p));
    });

    console.log(`\nTotal prefijos únicos encontrados: ${todosLosPrefijos.size}`);
    console.log('Prefijos:', Array.from(todosLosPrefijos).sort().slice(0, 30).join(', '));
}

analizarTodosLosPatrones().catch(console.error);
