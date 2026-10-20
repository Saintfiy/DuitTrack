import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/authenticated-request';

export async function GET(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { client, user } = auth;

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const filters = [`owner_id.eq.${user.id}`];
    if (profile?.business_id) filters.push(`id.eq.${profile.business_id}`);

    const { data, error } = await client
      .from('businesses')
      .select('*')
      .or(filters.join(','));

    if (error) throw error;

    return NextResponse.json({ businesses: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { client, user } = auth;

    const body = await request.json();
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const { data, error } = await client
      .from('businesses')
      .insert({
        name: body.name.trim(),
        industry: body.industry,
        country: body.country,
        currency: body.currency,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
