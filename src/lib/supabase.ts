import { createClient } from '@supabase/supabase-js';

// Using the credentials provided to ensure the connection works immediately
const supabaseUrl = 'https://svjnrkzeqgqxcrjrrmcg.supabase.co';
const supabaseAnonKey = 'sb_publishable_FHfeWy3cva8bq8Pc7ca5KQ_rBu9mYeb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);