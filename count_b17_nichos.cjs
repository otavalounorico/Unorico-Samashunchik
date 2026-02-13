const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function contarNichosB17() {
    console.log('=== TODOS LOS NICHOS CON CÓDIGO B17-* ===\n');

    // Buscar TODOS los nichos con código que empiece con B17
    const { data: nichosB17 } = await supabase
        .from('nichos_geom')
        .select('id, codigo, estado, bloques_geom_id')
        .ilike('codigo', 'B17-%')
        .order('codigo');

    console.log(`Total nichos con código B17-*: ${nichosB17?.length || 0}\n`);

    if (nichosB17 && nichosB17.length > 0) {
        // Agrupar por bloques_geom_id
        const porBloque = {};
        nichosB17.forEach(n => {
            const bloque = n.bloques_geom_id || 'NULL';
            if (!porBloque[bloque]) porBloque[bloque] = [];
            porBloque[bloque].push(n);
        });

        console.log('DISTRIBUCIÓN POR bloques_geom_id:');
        for (const [bloqueId, nichos] of Object.entries(porBloque)) {
            console.log(`\n  bloques_geom_id = ${bloqueId}: ${nichos.length} nichos`);
            console.log(`  Primeros 5: ${nichos.slice(0, 5).map(n => n.codigo).join(', ')}`);
        }

        console.log('\n\nPRIMEROS 10 NICHOS:');
        console.table(nichosB17.slice(0, 10));

        // Verificar info del bloque 17
        console.log('\n=== INFO DEL BLOQUE 17 ===');
        const { data: bloque17 } = await supabase
            .from('bloques_geom')
            .select('*')
            .eq('id', 17)
            .single();

        console.log(`Código: ${bloque17?.codigo}`);
        console.log(`Nombre: ${bloque17?.nombre}`);
        console.log(`Sector: ${bloque17?.sector}`);
    }
}

contarNichosB17().catch(console.error);
