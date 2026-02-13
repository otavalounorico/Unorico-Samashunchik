
const { createClient } = require('@supabase/supabase-js');

// Credenciales obtenidas de src/api/supabaseClient.js
const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSimilarity() {
    console.log("Buscando códigos similares a B1-NA...");

    const { data: nichosGeom, error: errG } = await supabase
        .from('nichos_geom')
        .select('codigo, estado')
        .ilike('codigo', 'B1-NA%')
        .limit(50);

    if (errG) {
        console.error(errG);
        return;
    }

    console.log("Codigos encontrados en nichos_geom (B1-NA%) con estado:");
    nichosGeom.forEach(n => console.log(`${n.codigo}: ${n.estado}`));
}

checkSimilarity();
