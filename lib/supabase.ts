import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env.local file.');
}

// Client-side Supabase client (used everywhere)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client  only import this in server-side code (API routes, Server Components)
// NEVER import this in client components
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only)');
  return createClient(supabaseUrl, serviceKey);
}
