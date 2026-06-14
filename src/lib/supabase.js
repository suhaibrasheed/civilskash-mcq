import { createClient } from '@supabase/supabase-js';

const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_AjmEclMh3nhv2NV5I62AAA_xM8OixCF';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eojryhfwtnjyegqhiust.supabase.co';

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_PUBLISHABLE_KEY;

export const isSupabaseConfigured = () => (
  Boolean(supabaseUrl) &&
  Boolean(supabaseKey) &&
  !supabaseUrl.includes('placeholder.supabase.co')
);

export const supabase = createClient(supabaseUrl, supabaseKey);
