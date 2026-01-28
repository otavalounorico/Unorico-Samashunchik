import { createClient } from '@supabase/supabase-js';

// Estas variables las tomaremos de un archivo de configuración seguro (.env)
const supabaseUrl = 'https://vktroniubxzxxxukirzn.supabase.co';
const supabaseAnonKey = 'sb_publishable_muDq3JHY2_MhdNyhFXlEow_Cm4iPmjj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);