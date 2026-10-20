import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/authenticated-request';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const auth = await getUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { client } = auth;
    const { businessId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = client
      .from('transactions')
      .select('*')
      .eq('business_id', businessId);

    if (type) query = query.eq('type', type);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ transactions: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const auth = await getUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { client } = auth;
    const { businessId } = await context.params;
    const body = await request.json();

    const { data, error } = await client
      .from('transactions')
      .insert({
        ...body,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ transaction: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
