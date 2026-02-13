const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticoCompleto() {
    console.log('=== DIAGNÓSTICO COMPLETO DE ASIGNACIONES ===\n');

    // Obtener todos los bloques
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('id');

    // Para cada bloque, ver qué nichos tiene
    console.log('BLOQUE | NICHOS ACTUALES | ESPERADOS SEGÚN CÓDIGO\n');

    for (const b of bloques) {
        const { data: nichos } = await supabase
            .from('nichos_geom')
            .select('codigo')
            .eq('bloques_geom_id', b.id);

        const prefijos = nichos && nichos.length > 0
            ? [...new Set(nichos.map(n => n.codigo.split('-')[0]))].join(', ')
            : '(vacío)';

        // Calcular qué debería tener según su código
        const match = b.codigo.match(/B-(\d+)/);
        const esperado = match ? `B${parseInt(match[1])}` : 'N/A';

        const correcto = prefijos.includes(esperado) || (prefijos === '(vacío)' && b.codigo === 'EV-20');
        const marca = correcto ? '✅' : '❌';

        console.log(`${marca} ID ${b.id.toString().padEnd(3)} [${b.codigo}] ${b.nombre.padEnd(12)} (${b.sector.substring(0, 8).padEnd(8)}) | Tiene: ${prefijos.padEnd(15)} | Esperado: ${esperado}`);
    }

    console.log('\n=== NICHOS MAL ASIGNADOS ===\n');

    // Buscar nichos que NO coinciden con el código del bloque
    const { data: todosNichos } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id');

    const problemas = [];
    for (const nicho of todosNichos) {
        const prefijo = nicho.codigo.split('-')[0]; // B1, B2, etc.
        const num = prefijo.substring(1); // 1, 2, etc.
        const codigoEsperado = num.length === 1 ? `B-0${num}` : `B-${num}`;

        // Buscar si existe un bloque con ese código
        const bloqueEsperado = bloques.find(b => b.codigo === codigoEsperado);

        if (bloqueEsperado && nicho.bloques_geom_id !== bloqueEsperado.id) {
            problemas.push({
                nicho: nicho.codigo,
                actual_id: nicho.bloques_geom_id,
                esperado_id: bloqueEsperado.id,
                esperado_bloque: `${bloqueEsperado.nombre} (${bloqueEsperado.sector})`
            });
        }
    }

    if (problemas.length > 0) {
        console.log(`Encontrados ${problemas.length} nichos mal asignados:`);
        console.table(problemas.slice(0, 10)); // Mostrar solo primeros 10
    } else {
        console.log('✅ ¡Todos los nichos están correctamente asignados!');
    }
}

diagnosticoCompleto().catch(console.error);
