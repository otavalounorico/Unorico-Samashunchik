
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSequence() {
    console.log("Fetching blocks for analysis (Colinas, Bovedas, Genesis)...");

    const targetSectors = ['COLINAS', 'BÓVEDAS', 'GÉNESIS'];

    const { data, error } = await supabase
        .from('bloques_geom')
        .select('id, codigo, nombre, sector')
        .in('sector', targetSectors)
        .order('sector, codigo'); // Sort by sector then code to see sequence

    if (error) {
        console.error("Error:", error);
        return;
    }

    const sectors = {};
    data.forEach(b => {
        const s = b.sector;
        if (!sectors[s]) sectors[s] = [];
        sectors[s].push(b);
    });

    Object.keys(sectors).forEach(s => {
        console.log(`\nSECTOR: ${s}`);
        let counter = 1;
        sectors[s].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true })); // Ensure numeric sort B-7 vs B-11

        sectors[s].forEach(b => {
            const expected = `Bloque ${String(counter).padStart(2, '0')}`;
            const match = b.nombre === expected ? "OK" : "MISMATCH";
            console.log(`  ${match} - Code: ${b.codigo} | CurrName: '${b.nombre}' | Expected: '${expected}'`);
            counter++;
        });
    });
}

checkSequence();
