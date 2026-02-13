const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simularCorreccion() {
    console.log('=== SIMULACIÓN DE CORRECCIÓN MASIVA ===\n');
    console.log('Esta simulación muestra a qué ID se moverán los nichos según su código.\n');

    // 1. Obtener todos los bloques disponibles
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector');

    // Mapa de Código -> ID para búsqueda rápida
    const mapaBloques = {};
    bloques.forEach(b => {
        const code = b.codigo.trim().toUpperCase();
        if (!mapaBloques[code]) mapaBloques[code] = [];
        mapaBloques[code].push(b);
    });

    // 2. Obtener prefijos únicos de nichos
    const { data: nichos } = await supabase.from('nichos_geom').select('codigo');
    const prefijos = new Set();
    nichos.forEach(n => {
        const match = n.codigo?.match(/^(B\d+)-/i);
        if (match) prefijos.add(match[1].toUpperCase());
    });

    const listaPrefijos = Array.from(prefijos).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

    console.log('Grupo Nichos | Busca Código | ID Destino (Simulado)           | Confirmación');
    console.log('-------------|--------------|---------------------------------|-------------');

    for (const p of listaPrefijos) {
        const num = p.slice(1);
        const codigoBuscado = num.length === 1 ? `B-0${num}` : `B-${num}`;

        const encontrados = mapaBloques[codigoBuscado];

        let resultado = '';
        let confirmacion = '';

        if (!encontrados) {
            resultado = '❌ NO EXISTE BLOQUE';
            confirmacion = 'ERROR';
        } else if (encontrados.length === 1) {
            const b = encontrados[0];
            resultado = `ID ${b.id} (${b.nombre} - ${b.sector})`;
            confirmacion = '✅ OK';
        } else {
            // Lógica de desempate (prioridad Capilla para B-08)
            const capilla = encontrados.find(b => b.sector.toUpperCase().includes('CAPILLA'));
            if (capilla) {
                resultado = `ID ${capilla.id} (${capilla.nombre} - ${capilla.sector})`;
                confirmacion = '✅ OK (Priorizado)';
            } else {
                const primero = encontrados[0];
                resultado = `ID ${primero.id} (${primero.nombre} - ${primero.sector})`;
                confirmacion = '⚠️ Múltiples (Usando 1ro)';
            }
        }

        console.log(`${p.padEnd(12)} | ${codigoBuscado.padEnd(12)} | ${resultado.padEnd(31)} | ${confirmacion}`);
    }
}

simularCorreccion().catch(console.error);
