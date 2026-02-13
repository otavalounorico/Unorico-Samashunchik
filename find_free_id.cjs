const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function encontrarIDLibre() {
    console.log('=== ENCONTRAR ID LIBRE PARA ESPACIO VERDE ===\n');

    // Obtener todos los IDs usados
    const { data: bloques } = await supabase
        .from('bloques_geom')
        .select('id')
        .order('id');

    const idsUsados = new Set(bloques?.map(b => b.id) || []);

    console.log(`Total bloques: ${bloques?.length}`);
    console.log(`IDs usados: ${Array.from(idsUsados).sort((a, b) => a - b).slice(0, 20).join(', ')}...\n`);

    // Encontrar primer ID disponible mayor a 100
    let idLibre = 100;
    while (idsUsados.has(idLibre)) {
        idLibre++;
    }

    console.log(`✓ ID libre encontrado: ${idLibre}\n`);

    // Ver el espacio verde actual
    const { data: espacioVerde } = await supabase
        .from('bloques_geom')
        .select('*')
        .eq('codigo', 'EV-20')
        .single();

    console.log('Espacio Verde actual:');
    console.table([{
        id: espacioVerde?.id,
        codigo: espacioVerde?.codigo,
        nombre: espacioVerde?.nombre,
        sector: espacioVerde?.sector
    }]);

    console.log(`\nSe puede cambiar de ID ${espacioVerde?.id} → ${idLibre}`);
}

encontrarIDLibre().catch(console.error);
