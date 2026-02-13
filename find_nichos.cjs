const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findNichosData() {
    console.log('=== BÚSQUEDA COMPLETA DE NICHOS ADMINISTRATIVOS ===\n');

    // 1. TODOS los nichos en la tabla nichos
    console.log('1. TODOS LOS NICHOS en tabla "nichos":');
    const { data: todosNichos } = await supabase
        .from('nichos')
        .select('*');

    console.log(`Total nichos administrativos: ${todosNichos?.length || 0}`);
    console.table(todosNichos);

    if (todosNichos && todosNichos.length > 0) {
        // Estadísticas generales
        const ocupados = todosNichos.filter(n => n.estado?.toLowerCase() === 'ocupado').length;
        const disponibles = todosNichos.filter(n => n.socio_id === null).length;
        const mantenimiento = todosNichos.filter(n => n.estado?.toLowerCase() === 'mantenimiento').length;

        console.log('\nESTADÍSTICAS GENERALES:');
        console.log(`- Ocupados (estado='ocupado'): ${ocupados}`);
        console.log(`- Sin dueño (socio_id=null): ${disponibles}`);
        console.log(`- Mantenimiento: ${mantenimiento}`);

        // Ahora verificar a qué bloques pertenecen
        const bloquesIds = [...new Set(todosNichos.map(n => n.bloque_id))];
        console.log(`\n2. Bloques a los que pertenecen (IDs): ${bloquesIds.join(', ')}`);

        const { data: bloquesInfo } = await supabase
            .from('bloques')
            .select('*')
            .in('id', bloquesIds);

        console.log(`\nBloques lógicos encontrados: ${bloquesInfo?.length || 0}`);
        console.table(bloquesInfo);

        // Si hay bloques, ver sus vínculos con bloques_geom
        if (bloquesInfo && bloquesInfo.length > 0) {
            const bloqueGeomIds = bloquesInfo.map(b => b.bloque_geom_id).filter(id => id != null);
            if (bloqueGeomIds.length > 0) {
                const { data: bloquesGeomInfo } = await supabase
                    .from('bloques_geom')
                    .select('*')
                    .in('id', bloqueGeomIds);

                console.log(`\n3. Bloques geométricos vinculados: ${bloquesGeomInfo?.length || 0}`);
                console.table(bloquesGeomInfo);
            }
        }
    }
}

findNichosData().catch(console.error);
