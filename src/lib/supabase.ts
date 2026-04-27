import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mbyxkwlzpifibphbshny.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OZ1SLLj9FckERLX__k-gIw_PzQ3HeA_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
