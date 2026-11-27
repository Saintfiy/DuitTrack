// Fitur Register: POST /api/auth/register
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/utils/auth';
import { createClientStub, type Result } from './query-stub';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/utils/auth', () => ({ generateToken: vi.fn() }));

const input = { email: 'budi@example.test', password: 'contoh-sandi', fullName: 'Budi' };
const userRow = { id: 'user-1', email: input.email, full_name: 'Budi', role: 'owner' };

function useAdmin(createUser: Result, insert: Result) {
  const client = createClientStub({ users: insert });
  const admin = { ...client, auth: { admin: { createUser: vi.fn(async () => createUser) } } };
  vi.mocked(getSupabaseAdmin).mockReturnValue(admin as any);
  return admin;
}

const callPost = () =>
  POST(new NextRequest('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(input) }));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.mocked(generateToken).mockReset().mockReturnValue('token-uji');
  });

  test('REG-01 berhasil mendaftar dan membuat token', async () => {
    // Arrange
    const admin = useAdmin({ data: { user: { id: 'user-1' } }, error: null }, { data: userRow });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: userRow, token: 'token-uji' });
    expect(admin.queries.users.insert).toHaveBeenCalledWith(userRow);
    expect(generateToken).toHaveBeenCalledWith({ userId: 'user-1', email: input.email });
  });

  test('REG-02 gagal saat pembuatan akun ditolak', async () => {
    // Arrange
    const admin = useAdmin({ data: null, error: { message: 'Email sudah terdaftar' } }, {});

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Email sudah terdaftar' });
    expect(admin.from).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });

  test('REG-03 gagal saat data pengguna tidak tersimpan', async () => {
    // Arrange
    useAdmin({ data: { user: { id: 'user-1' } }, error: null }, { error: { message: 'Insert gagal' } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Insert gagal' });
    expect(generateToken).not.toHaveBeenCalled();
  });
});
