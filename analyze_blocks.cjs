const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analizarBloques() {
    console.log('=== ANÁLISIS DE CONSISTENCIA DE BLOQUES ===\n');

    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('id');

    console.log(`Total bloques: ${bloques?.length}`);
    console.log('ID | Codigo | Nombre | Sector | ¿Coincide?');
    console.log('---|---|---|---|---');

    const inconsistentes = [];

    bloques.forEach(b => {
        // Extraer número del nombre "Bloque XX"
        const matchNombre = b.nombre?.match(/Bloque (\d+)/i);
        const numNombre = matchNombre ? parseInt(matchNombre[1]) : null;

        // Extraer número del código "B-XX"
        const matchCodigo = b.codigo?.match(/B-(\d+)/i);
        const numCodigo = matchCodigo ? parseInt(matchCodigo[1]) : null;

        // Verificar si coinciden (ignorar EV-20)
        let coincide = '✅';
        if (b.codigo !== 'EV-20') {
            if (numNombre !== numCodigo || b.id !== numCodigo) {
                coincide = '❌';
                inconsistentes.push(b);
            }
        }

        console.log(`${b.id.toString().padEnd(3)} | ${b.codigo.padEnd(6)} | ${b.nombre.padEnd(12)} | ${b.sector.padEnd(15)} | ${coincide}`);
    });

    console.log('\n=== RESUMEN DE INCONSISTENCIAS ===');
    console.log(`Bloques con inconsistencias: ${inconsistentes.length}`);
    if (inconsistentes.length > 0) {
        console.log('Estos bloques tienen ID, Código o Nombre que no coinciden entre sí.');
        console.log('Recomendación: Alinear ID = Código numérico = Nombre numérico.');
    }

    // Ver nichos B5 para entender el caso específico
    const { data: b5 } = await supabase.from('nichos_geom').select('bloques_geom_id').ilike('codigo', 'B5-%').limit(1);
    console.log(`\nEjemplo Nicho B5 está en ID: ${b5?.[0]?.bloques_geom_id}`);
}

analizarBloques().catch(console.error);
