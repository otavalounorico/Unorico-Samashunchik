
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNames() {
    console.log("Fetching ALL blocks...");
    // Fetch ALL blocks
    const { data, error } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('sector, codigo');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const sectors = {};
    data.forEach(b => {
        const s = b.sector || 'UNKNOWN';
        if (!sectors[s]) sectors[s] = [];
        sectors[s].push(b);
    });

    console.log("Renaming blocks sequentially by code...");

    for (const s of Object.keys(sectors)) {
        const blocks = sectors[s];
        // Numeric sort for codes like B-7, B-11
        blocks.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

        let counter = 1;
        for (const b of blocks) {
            const newName = `Bloque ${String(counter).padStart(2, '0')}`;

            if (b.nombre !== newName) {
                console.log(`[${s}] Updating ID ${b.id} (${b.codigo}): '${b.nombre}' -> '${newName}'`);

                const { error: updateError } = await supabase
                    .from('bloques_geom')
                    .update({ nombre: newName })
                    .eq('id', b.id);

                if (updateError) console.error(`Failed to update ${b.id}:`, updateError);
            } else {
                // console.log(`[${s}] skipping ${b.codigo} already ${newName}`);
            }
            counter++;
        }
    }
    console.log("Done.");
}

fixNames();
