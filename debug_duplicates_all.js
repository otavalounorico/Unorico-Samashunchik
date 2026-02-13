
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log("Fetching ALL blocks...");
    const { data, error } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .order('sector, nombre');

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

    console.log("Checking for duplicates in each sector...");
    let totalDups = 0;

    Object.keys(sectors).forEach(s => {
        const blocks = sectors[s];
        const names = {};
        const dups = [];

        blocks.forEach(b => {
            const n = b.nombre || 'NO_NAME';
            if (!names[n]) names[n] = [];
            names[n].push(b);
        });

        Object.keys(names).forEach(n => {
            if (names[n].length > 1) {
                dups.push({ name: n, items: names[n] });
            }
        });

        if (dups.length > 0) {
            console.log(`\nSECTOR: ${s}`);
            dups.forEach(d => {
                console.log(`  DUPLICATE NAME: '${d.name}' (${d.items.length} times)`);
                d.items.forEach(item => {
                    console.log(`    - ID: ${item.id}, Code: '${item.codigo}'`);
                });
                totalDups++;
            });
        }
    });

    if (totalDups === 0) console.log("No duplicate names found within sectors.");
}

checkDuplicates();
