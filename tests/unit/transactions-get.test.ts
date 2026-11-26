// Unit test GET /api/transactions/[businessId]
// TC-01 sampai TC-04 mengikuti analisis white-box pada Pre-Lab Modul 4.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/transactions/[businessId]/route';
import { getUser } from '@/lib/authenticated-request';
import { FakeSupabaseClient, type Row } from './fake-supabase';

// getUser diganti agar test tidak menghubungi Supabase Auth.
vi.mock('@/lib/authenticated-request', () => ({ getUser: vi.fn() }));
const getUserStub = vi.mocked(getUser);

const BASE_URL = 'http://localhost/api/transactions/biz-001';
const FILTERS = '?type=income&dateFrom=2026-01-01&dateTo=2026-12-31';

const tx1: Row = { id: 'tx-1', business_id: 'biz-001', type: 'income', date: '2026-03-10' };
const tx2: Row = { id: 'tx-2', business_id: 'biz-001', type: 'income', date: '2026-02-05' };
const otherBusinessTx: Row = { id: 'tx-9', business_id: 'biz-002', type: 'income', date: '2026-04-01' };

function callGet(query = '') {
  const request = new NextRequest(BASE_URL + query);
  return GET(request, { params: Promise.resolve({ businessId: 'biz-001' }) });
}

function loginWith(client: FakeSupabaseClient) {
  getUserStub.mockResolvedValue({ client, user: { id: 'user-1' } } as any);
}

describe('GET /api/transactions/[businessId]', () => {
  beforeEach(() => {
    getUserStub.mockReset();
  });

  test('TC-01 menolak request tanpa token dengan status 401', async () => {
    // Arrange
    getUserStub.mockResolvedValue(null);

    // Act
    const response = await callGet();

    // Assert
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  test('TC-02 menerapkan filter type, dateFrom, dan dateTo', async () => {
    // Arrange
    const client = new FakeSupabaseClient([tx2, otherBusinessTx, tx1]);
    const eqSpy = vi.spyOn(client.query, 'eq');
    const gteSpy = vi.spyOn(client.query, 'gte');
    const lteSpy = vi.spyOn(client.query, 'lte');
    loginWith(client);

    // Act
    const response = await callGet(FILTERS);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transactions: [tx1, tx2] });
    expect(eqSpy).toHaveBeenCalledWith('business_id', 'biz-001');
    expect(eqSpy).toHaveBeenCalledWith('type', 'income');
    expect(gteSpy).toHaveBeenCalledWith('date', '2026-01-01');
    expect(lteSpy).toHaveBeenCalledWith('date', '2026-12-31');
  });

  test('TC-03 mengembalikan status 400 saat query database gagal', async () => {
    // Arrange
    loginWith(new FakeSupabaseClient([tx1, tx2], { message: 'DB error' }));

    // Act
    const response = await callGet(FILTERS);

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'DB error' });
  });

  test('TC-04 tanpa query string tidak menambahkan filter opsional', async () => {
    // Arrange
    const client = new FakeSupabaseClient([tx2, otherBusinessTx, tx1]);
    const eqSpy = vi.spyOn(client.query, 'eq');
    const gteSpy = vi.spyOn(client.query, 'gte');
    const lteSpy = vi.spyOn(client.query, 'lte');
    loginWith(client);

    // Act
    const response = await callGet();

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transactions: [tx1, tx2] });
    expect(eqSpy).toHaveBeenCalledTimes(1);
    expect(eqSpy).toHaveBeenCalledWith('business_id', 'biz-001');
    expect(gteSpy).not.toHaveBeenCalled();
    expect(lteSpy).not.toHaveBeenCalled();
  });
});
