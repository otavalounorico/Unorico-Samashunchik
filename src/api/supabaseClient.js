import { createClient } from '@supabase/supabase-js';
// Variables de entorno o constantes centralizadas
const supabaseUrl = 'https://xoeiqbouzlbftwhsgasm.supabase.co';
const supabaseAnonKey = 'sb_publishable_GeLC7wl3aHdykd5iLgbgSw_EpPnhZFT';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)