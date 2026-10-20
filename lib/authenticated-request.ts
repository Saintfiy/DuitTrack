import { createClient } from '@supabase/supabase-js';

export async function getUser(request: Request) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase authentication is not configured');
  }

  const accessToken = match[1];
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error } = await client.auth.getUser(accessToken);

  if (error || !user) return null;
  return { client, user };
}
