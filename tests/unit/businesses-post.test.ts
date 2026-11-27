// Fitur Data Usaha: POST /api/businesses
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/businesses/route';
import { getUser } from '@/lib/authenticated-request';
import { createClientStub, type Result } from './query-stub';

vi.mock('@/lib/authenticated-request', () => ({ getUser: vi.fn() }));

function loginWith(insert: Result) {
  const client = createClientStub({ businesses: insert });
  vi.mocked(getUser).mockResolvedValue({ client, user: { id: 'user-1' } } as any);
  return client;
}

const callPost = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/businesses', { method: 'POST', body: JSON.stringify(body) }));

describe('POST /api/businesses', () => {
  beforeEach(() => {
    vi.mocked(getUser).mockReset();
  });

  test('BIZ-01 menolak request tanpa login', async () => {
    // Arrange
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const response = await callPost({ name: 'Toko Maju' });

    // Assert
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  test('BIZ-02 menolak nama usaha kosong', async () => {
    // Arrange
    const client = loginWith({});

    // Act
    const response = await callPost({ name: '   ' });

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Business name is required' });
    expect(client.from).not.toHaveBeenCalled();
  });

  test('BIZ-03 menolak jenis workspace yang tidak dikenal', async () => {
    // Arrange
    const client = loginWith({});

    // Act
    const response = await callPost({ name: 'Toko Maju', workspace_type: 'lain' });

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid workspace type' });
    expect(client.from).not.toHaveBeenCalled();
  });

  test('BIZ-04 menyimpan usaha dengan workspace bawaan business', async () => {
    // Arrange
    const client = loginWith({ data: { id: 'biz-001', name: 'Toko Maju' } });

    // Act
    const response = await callPost({ name: '  Toko Maju  ' });

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ business: { id: 'biz-001', name: 'Toko Maju' } });
    expect(client.queries.businesses.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Toko Maju', workspace_type: 'business', owner_id: 'user-1' }),
    );
  });

  test('BIZ-05 gagal saat penyimpanan database error', async () => {
    // Arrange
    loginWith({ error: { message: 'DB error' } });

    // Act
    const response = await callPost({ name: 'Toko Maju', workspace_type: 'personal' });

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'DB error' });
  });
});
