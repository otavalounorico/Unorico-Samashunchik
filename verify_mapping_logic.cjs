const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarCodigos() {
    console.log('=== VERIFICANDO DUPLICADOS DE CÓDIGO DE BLOQUE ===\n');

    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector');

    const codigos = {};
    bloques.forEach(b => {
        const code = b.codigo.trim().toUpperCase();
        if (!codigos[code]) codigos[code] = [];
        codigos[code].push(b);
    });

    console.log('Códigos duplicados:');
    Object.keys(codigos).forEach(c => {
        if (codigos[c].length > 1) {
            console.log(`\nCódigo ${c}:`);
            codigos[c].forEach(b => console.log(`  - ID: ${b.id} | ${b.nombre} | ${b.sector}`));
        }
    });

    console.log('\n=== SIMULACIÓN DE ASIGNACIÓN ===\n');

    // Obtener prefijos únicos de nichos
    const { data: nichos } = await supabase.from('nichos_geom').select('codigo');
    const prefijos = new Set();
    nichos.forEach(n => {
        const match = n.codigo?.match(/^(B\d+)-/i);
        if (match) prefijos.add(match[1].toUpperCase());
    });

    const prefijosArr = Array.from(prefijos).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

    console.log('Prefijo | Código Buscado | Destino Propuesto | ¿Conflicto?');
    console.log('--------|----------------|-------------------|------------');

    prefijosArr.forEach(p => {
        const num = p.slice(1); // "B1" -> "1"
        const codigoBuscado = `B-${num.padStart(2, '0')}`; // "1" -> "B-01"

        const targets = codigos[codigoBuscado];

        let destino = 'NO ENCONTRADO ❌';
        let conflicto = '';

        if (targets && targets.length === 1) {
            const t = targets[0];
            destino = `ID ${t.id} (${t.nombre} - ${t.sector})`;
            conflicto = '✅';
        } else if (targets && targets.length > 1) {
            destino = 'MÚLTIPLES OPCIONES';
            conflicto = '⚠️ CONFLICTO';
            targets.forEach(t => {
                destino += `\n          -> ID ${t.id} (${t.nombre} - ${t.sector})`;
            });
        }

        console.log(`${p.padEnd(7)} | ${codigoBuscado.padEnd(14)} | ${destino.split('\n')[0].padEnd(17)} | ${conflicto}`);
        if (destino.includes('\n')) {
            console.log(destino.split('\n').slice(1).join('\n'));
        }
    });
}

verificarCodigos().catch(console.error);
