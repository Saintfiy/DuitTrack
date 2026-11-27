// Fitur Login: POST /api/auth/login
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { supabase } from '@/lib/supabase';
import { generateToken } from '@/utils/auth';
import { createQuery, type Result } from './query-stub';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: vi.fn() }, from: vi.fn() },
}));
vi.mock('@/utils/auth', () => ({ generateToken: vi.fn() }));

const input = { email: 'budi@example.test', password: 'contoh-sandi' };
const session = { id: 'sesi-1' };
const userRow = { id: 'user-1', email: input.email };

function useSupabase(signIn: Result, profile: Result) {
  vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(signIn as any);
  vi.mocked(supabase.from).mockReturnValue(createQuery(profile));
}

const callPost = () =>
  POST(new NextRequest('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify(input) }));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(generateToken).mockReturnValue('token-uji');
  });

  test('LOG-01 berhasil login', async () => {
    // Arrange
    useSupabase({ data: { user: { id: 'user-1' }, session }, error: null }, { data: userRow });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: userRow, session, token: 'token-uji' });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(input);
    expect(generateToken).toHaveBeenCalledWith({ userId: 'user-1', email: input.email });
  });

  test('LOG-02 menolak kredensial yang salah', async () => {
    // Arrange
    useSupabase({ data: null, error: { message: 'Invalid login credentials' } }, {});

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid login credentials' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('LOG-03 gagal saat data pengguna tidak ditemukan', async () => {
    // Arrange
    useSupabase({ data: { user: { id: 'user-1' }, session }, error: null }, { error: { message: 'User tidak ditemukan' } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'User tidak ditemukan' });
    expect(generateToken).not.toHaveBeenCalled();
  });
});
