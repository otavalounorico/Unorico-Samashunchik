import { createClient } from '@supabase/supabase-js';
// Variables de entorno o constantes centralizadas
const supabaseUrl = 'https://fndxvondeencofreglxy.supabase.co';
const supabaseAnonKey = 'sb_publishable_o-IInwEPRi2YdzRyTQkveA_czDtA-j4';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)