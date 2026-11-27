// Fitur Asisten AI: POST /api/chat
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { getUser } from '@/lib/authenticated-request';
import { createClientStub, type Result } from './query-stub';

vi.mock('@/lib/authenticated-request', () => ({ getUser: vi.fn() }));

const fetchMock = vi.fn();
const body = { messages: [{ role: 'user', content: 'Halo' }, { role: 'ai', content: 'Hai' }], context: {} };
const personal: Record<string, Result> = { users: { data: { business_id: 'biz-001' } }, businesses: { data: { workspace_type: 'personal' } } };
const noProfile: Record<string, Result> = { users: { data: null } };

function loginWith(tables: Record<string, Result>) {
  vi.mocked(getUser).mockResolvedValue({ client: createClientStub(tables), user: { id: 'user-1' } } as any);
}
const callPost = (payload: unknown = body) =>
  POST(new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify(payload) }));
const sentMessages = () => JSON.parse(fetchMock.mock.calls[0][1].body).messages;

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('OPENROUTER_API_KEY', 'kunci-uji');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test('CHT-01 menolak request tanpa login', async () => {
    // Arrange
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('CHT-02 menolak body tanpa messages dan context', async () => {
    // Arrange
    loginWith(noProfile);

    // Act
    const response = await callPost({});

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Messages and context are required' });
  });

  test('CHT-03 gagal saat API key tidak dikonfigurasi', async () => {
    // Arrange
    loginWith(noProfile);
    vi.stubEnv('OPENROUTER_API_KEY', '');

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'OpenRouter API key not configured' });
  });

  test('CHT-04 gagal saat membaca profil error', async () => {
    // Arrange
    loginWith({ users: { error: { message: 'Profil gagal' } } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Profil gagal' });
  });

  test('CHT-05 gagal saat membaca workspace error', async () => {
    // Arrange
    loginWith({ users: { data: { business_id: 'biz-001' } }, businesses: { error: { message: 'Workspace gagal' } } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Workspace gagal' });
  });

  test('CHT-06 menjawab pengguna workspace pribadi', async () => {
    // Arrange
    loginWith(personal);
    fetchMock.mockResolvedValue(Response.json({ choices: [{ message: { content: 'Jawaban AI' } }] }));
    const context = { lowStock: [{ name: 'Kertas', quantity: 1 }], overdueDebts: [{}] };

    // Act
    const response = await callPost({ ...body, context });

    // Assert
    expect(await response.json()).toEqual({ reply: 'Jawaban AI' });
    expect(sentMessages()[0].content).toContain('keuangan pribadi');
    expect(sentMessages()[0].content).toContain('Kertas (1 sisa)');
    expect(sentMessages()[2]).toEqual({ role: 'assistant', content: 'Hai' });
  });

  test('CHT-07 memberi jawaban bawaan saat balasan AI kosong', async () => {
    // Arrange
    loginWith(noProfile);
    fetchMock.mockResolvedValue(Response.json({}));

    // Act
    const response = await callPost();

    // Assert
    expect(await response.json()).toEqual({ reply: 'Maaf, saya tidak dapat merespons saat ini.' });
    expect(sentMessages()[0].content).toContain('UMKM');
  });

  test('CHT-08 meneruskan status error dari OpenRouter', async () => {
    // Arrange
    loginWith(noProfile);
    fetchMock.mockResolvedValue(new Response('terlalu banyak', { status: 429 }));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: 'Failed to fetch from OpenRouter' });
  });

  test('CHT-09 menangani kegagalan jaringan', async () => {
    // Arrange
    loginWith(noProfile);
    fetchMock.mockRejectedValue({});

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
  });
});
