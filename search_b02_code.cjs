const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function buscarNichosB02() {
    console.log('=== BUSCANDO NICHOS CON CÓDIGO B-02-* ===\n');

    // Buscar nichos con código B-02-*
    const { data: nichosB02 } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado, bloques_geom_id')
        .ilike('codigo', 'B-02-%')
        .order('codigo');

    console.log(`Total nichos con código B-02-*: ${nichosB02?.length || 0}\n`);

    if (nichosB02 && nichosB02.length > 0) {
        // Agrupar por bloques_geom_id
        const porBloque = {};
        nichosB02.forEach(n => {
            const bloque = n.bloques_geom_id || 'NULL';
            if (!porBloque[bloque]) porBloque[bloque] = [];
            porBloque[bloque].push(n);
        });

        console.log('DISTRIBUCIÓN POR bloques_geom_id:');
        for (const [bloqueId, nichos] of Object.entries(porBloque)) {
            // Obtener info del bloque
            const { data: bloqueInfo } = await supabase
                .from('bloques_geom')
                .select('codigo, nombre, sector')
                .eq('id', bloqueId)
                .single();

            console.log(`\n  bloques_geom_id = ${bloqueId} (${bloqueInfo?.codigo} - ${bloqueInfo?.sector}): ${nichos.length} nichos`);
            console.log(`  Primeros 5: ${nichos.slice(0, 5).map(n => n.codigo).join(', ')}`);
        }

        console.log('\n\nPRIMEROS 10 NICHOS:');
        console.table(nichosB02.slice(0, 10));
    } else {
        console.log('No se encontraron nichos con código B-02-*');
    }
}

buscarNichosB02().catch(console.error);
