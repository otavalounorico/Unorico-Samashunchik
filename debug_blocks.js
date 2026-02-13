
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlocks() {
    console.log("Fetching blocks with name 'Bloque 02'...");
    const { data, error } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .eq('nombre', 'Bloque 02')
        .order('sector');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Found blocks:", data.length);
    console.log(JSON.stringify(data, null, 2));

    // Check for duplicates by code
    const counts = {};
    data.forEach(b => {
        const key = `${b.sector}-${b.codigo}`;
        counts[key] = (counts[key] || 0) + 1;
    });

    console.log("\nDuplicates:");
    Object.keys(counts).forEach(k => {
        if (counts[k] > 1) {
            console.log(`${k}: ${counts[k]} times`);
        }
    });
}

checkBlocks();
