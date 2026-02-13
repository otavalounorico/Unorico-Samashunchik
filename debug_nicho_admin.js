
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNicheAdmin() {
    const codes = ['B5-NB054', 'B5-NB055'];

    for (const c of codes) {
        console.log(`\nChecking Niche: ${c}`);

        // Check NICHOS table (Admin)
        const { data: nAdmin, error: e1 } = await supabase
            .from('nichos')
            .select(`
            id, codice:codigo, estado,
            bloques ( id, nombre, codigo, bloques_geom(sector) )
        `)
            .eq('codigo', c)
            .maybeSingle();

        if (e1) console.error(e1);
        if (nAdmin) {
            console.log(`[Admin] Block Name: '${nAdmin.bloques?.nombre}'`);
            console.log(`[Admin] Block Code: '${nAdmin.bloques?.codigo}'`);
            console.log(`[Admin] Sector: '${nAdmin.bloques?.bloques_geom?.sector}'`);
        } else {
            console.log("[Admin] Not found in 'nichos' table.");
        }

        // Check NICHOS_GEOM table (Spatial)
        const { data: nGeom, error: e2 } = await supabase
            .from('nichos_geom')
            .select(`
            id, codigo, bloques_geom_id,
            bloques_geom ( nombre, codigo, sector )
        `)
            .eq('codigo', c)
            .maybeSingle();

        if (e2) console.error(e2);
        if (nGeom) {
            console.log(`[Spatial] Block Name: '${nGeom.bloques_geom?.nombre}'`);
            console.log(`[Spatial] Block Code: '${nGeom.bloques_geom?.codigo}'`);
            console.log(`[Spatial] Sector: '${nGeom.bloques_geom?.sector}'`);
        } else {
            console.log("[Spatial] Not found in 'nichos_geom' table.");
        }
    }
}

checkNicheAdmin();
