
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNiches() {
    // B-05 (Bloque 02, ID 15)
    console.log("\nChecking niches for Bloque 02 (ID 15, B-05):");
    const { data: n1, error: e1 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 15)
        .limit(10);

    if (e1) console.error(e1);
    else console.log("Example codes:", n1.map(n => n.codigo));

    const { count: c1 } = await supabase.from('nichos_geom').select('*', { count: 'exact', head: true }).eq('bloques_geom_id', 15);
    console.log("Total niches:", c1);


    // B-06 (Bloque 03, ID 2)
    console.log("\nChecking niches for Bloque 03 (ID 2, B-06):");
    const { data: n2, error: e2 } = await supabase
        .from('nichos_geom')
        .select('codigo')
        .eq('bloques_geom_id', 2)
        .limit(10);

    if (e2) console.error(e2);
    else console.log("Example codes:", n2.map(n => n.codigo));

    const { count: c2 } = await supabase.from('nichos_geom').select('*', { count: 'exact', head: true }).eq('bloques_geom_id', 2);
    console.log("Total niches:", c2);

    // Check if any B6 codes are in Block 15 (Error?)
    console.log("\nChecking for B6 codes in Block 15 (Should be 0?):");
    const { data: err1 } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id')
        .eq('bloques_geom_id', 15)
        .ilike('codigo', 'B6%');
    console.log("Found:", err1?.length, err1?.map(x => x.codigo));

    // Check if any B5 codes are in Block 2 (Error?)
    console.log("\nChecking for B5 codes in Block 2 (Should be 0?):");
    const { data: err2 } = await supabase
        .from('nichos_geom')
        .select('codigo, bloques_geom_id')
        .eq('bloques_geom_id', 2)
        .ilike('codigo', 'B5%');
    // Check ADMINISTRATIVE blocks (table 'bloques')
    console.log("\nChecking ADMINISTRATIVE blocks in Genesis:");
    const { data: adminBlocks } = await supabase
        .from('bloques')
        .select('id, nombre, codigo, bloques_geom_id, bloques_geom(sector)');
    // Removed .not null check to see everything

    if (!adminBlocks) {
        console.log("No admin blocks returned.");
    } else {
        const genesisAdmin = adminBlocks.filter(b => {
            const s = b.bloques_geom?.sector;
            return s && s.toUpperCase().includes('GÉNESIS');
        });
        console.log("Admin Blocks in Genesis:", genesisAdmin.length);
        genesisAdmin.forEach(b => {
            console.log(`AdminID: ${b.id}, Name: '${b.nombre}', Code: '${b.codigo}', LinkGeomID: ${b.bloques_geom_id}`);
        });
    }

    // Check if any Admin Block named "Bloque 02" links to Geom ID 2 (which is Bloque 03)
    const weird = genesisAdmin.filter(b => b.nombre === 'Bloque 02' && b.bloques_geom_id === 2);
    if (weird.length > 0) console.log("FOUND MISLINKED BLOCK:", weird);

}

checkNiches();
