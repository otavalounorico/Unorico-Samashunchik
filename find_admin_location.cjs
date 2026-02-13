const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAdminNichosLocation() {
    console.log('=== UBICACIÓN DE LOS 3 NICHOS ADMINISTRATIVOS ===\n');

    // Los 3 nichos que sabemos que existen
    const nichosCodigos = ['B1-NA01', 'B2-NB02', 'B2-NB01'];

    for (const codigo of nichosCodigos) {
        console.log(`\n--- Nicho: ${codigo} ---`);

        // Obtener info administrativa
        const { data: admin } = await supabase
            .from('nichos')
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (admin) {
            console.log(`  Estado: ${admin.estado}`);
            console.log(`  Socio_ID: ${admin.socio_id}`);
            console.log(`  Disponible: ${admin.disponible}`);
            console.log(`  Bloque_ID: ${admin.bloque_id}`);
            console.log(`  Nicho_Geom_ID: ${admin.nicho_geom_id}`);

            // Buscar el nicho_geom correspondiente
            if (admin.nicho_geom_id) {
                const { data: geom } = await supabase
                    .from('nichos_geom')
                    .select('*, bloques_geom_id')
                    .eq('id', admin.nicho_geom_id)
                    .single();

                if (geom) {
                    console.log(`  📍 Nichos_geom encontrado:`);
                    console.log(`     - Código en geom: ${geom.codigo}`);
                    console.log(`     - Estado en geom: ${geom.estado}`);
                    console.log(`     - Bloques_geom_ID: ${geom.bloques_geom_id}`);

                    // Buscar el bloque_geom
                    if (geom.bloques_geom_id) {
                        const { data: bloqueGeom } = await supabase
                            .from('bloques_geom')
                            .select('*')
                            .eq('id', geom.bloques_geom_id)
                            .single();

                        if (bloqueGeom) {
                            console.log(`     - 🏢 Bloque: ${bloqueGeom.codigo} - ${bloqueGeom.nombre}`);
                            console.log(`     - 🎯 Sector: ${bloqueGeom.sector}`);
                        }
                    }
                }
            }
        }
    }
}

findAdminNichosLocation().catch(console.error);
