const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function mapeoCompleto() {
    console.log('=== LISTA COMPLETA DE BLOQUES DISPONIBLES ===\n');

    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('sector', { ascending: true })
        .order('nombre', { ascending: true });

    console.log('ID  | Código | Nombre      | Sector');
    console.log('----|--------|-------------|----------------');
    bloques.forEach(b => {
        console.log(`${b.id.toString().padEnd(3)} | ${b.codigo.padEnd(6)} | ${b.nombre.padEnd(11)} | ${b.sector}`);
    });

    console.log('\n=== PREFIJOS DE NICHOS EN USO ===\n');

    // Obtener todos los códigos para extraer prefijos únicos
    const { data: nichos } = await supabase
        .from('nichos_geom')
        .select('codigo');

    const conteoPrefijos = {};
    nichos.forEach(n => {
        const match = n.codigo?.match(/^(B\d+)-/i);
        if (match) {
            const prefijo = match[1].toUpperCase();
            conteoPrefijos[prefijo] = (conteoPrefijos[prefijo] || 0) + 1;
        }
    });

    console.log('Prefijo | Cantidad | Bloque Sugerido (Nombre)');
    const prefijosOrdenados = Object.keys(conteoPrefijos).sort((a, b) => {
        return parseInt(a.substring(1)) - parseInt(b.substring(1));
    });

    prefijosOrdenados.forEach(p => {
        // Intentar adivinar el bloque sugerido basado en el número
        const num = parseInt(p.substring(1));
        const sugeridos = bloques.filter(b => {
            const bNum = parseInt(b.nombre?.match(/Bloque (\d+)/i)?.[1] || '0');
            return bNum === num;
        });

        const sugerencia = sugeridos.map(s => `[ID:${s.id} ${s.sector}]`).join(', ');
        console.log(`${p.padEnd(7)} | ${conteoPrefijos[p].toString().padEnd(8)} | ${sugerencia}`);
    });
}

mapeoCompleto().catch(console.error);
