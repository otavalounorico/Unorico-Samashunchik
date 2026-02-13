
const { createClient } = require('@supabase/supabase-js');

// Credenciales obtenidas de src/api/supabaseClient.js
const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNulls() {
    console.log("Verificando nulos en estado...");

    const { count, error } = await supabase
        .from('nichos')
        .select('*', { count: 'exact', head: true })
        .is('estado', null);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Nichos con estado NULL: ${count}`);

    // También verificar si 'DISPONIBLE' existe como string, por si el script anterior falló o estaba limitado
    const { count: cDisp, error: eDisp } = await supabase
        .from('nichos')
        .select('*', { count: 'exact', head: true })
        .ilike('estado', 'DISPONIBLE');

    console.log(`Nichos con estado 'DISPONIBLE': ${cDisp}`);
}

checkNulls();
