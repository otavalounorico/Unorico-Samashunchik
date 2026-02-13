
const { createClient } = require('@supabase/supabase-js');

// Credenciales obtenidas de src/api/supabaseClient.js
const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEstados() {
    console.log("Consultando estados únicos en tabla 'nichos'...");

    const { data: nichos, error } = await supabase
        .from('nichos')
        .select('estado');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const estadosUnicos = [...new Set(nichos.map(n => n.estado?.toUpperCase()))];
    console.log("Estados encontrados:", estadosUnicos);
}

checkEstados();
