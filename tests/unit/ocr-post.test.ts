// Fitur Scan Struk: POST /api/ocr
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ocr/route';
import { getUser } from '@/lib/authenticated-request';
import { createClientStub, type Result } from './query-stub';

// Mock pengganti library Gemini agar test tidak memanggil layanan AI.
const gemini = vi.hoisted(() => ({ generateContent: vi.fn(), getGenerativeModel: vi.fn() }));
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = gemini.getGenerativeModel;
  },
}));
vi.mock('@/lib/authenticated-request', () => ({ getUser: vi.fn() }));

const image = { imageBase64: 'aGFsbw==', mimeType: 'image/png' };
const business: Record<string, Result> = { users: { data: { business_id: 'biz-001' } }, businesses: { data: { workspace_type: 'business' } } };
const personal: Record<string, Result> = { ...business, businesses: { data: { workspace_type: 'personal' } } };
const noProfile: Record<string, Result> = { users: { data: null } };

function loginWith(tables: Record<string, Result>) {
  vi.mocked(getUser).mockResolvedValue({ client: createClientStub(tables), user: { id: 'user-1' } } as any);
}
const reply = (text: string) => ({ response: { text: () => text } });
const callPost = (body: unknown = image) =>
  POST(new NextRequest('http://localhost/api/ocr', { method: 'POST', body: JSON.stringify(body) }));

describe('POST /api/ocr', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('GEMINI_API_KEY', 'kunci-uji');
    gemini.getGenerativeModel.mockReturnValue({ generateContent: gemini.generateContent });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('OCR-01 menolak request tanpa login', async () => {
    // Arrange
    vi.mocked(getUser).mockResolvedValue(null);

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(401);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  test('OCR-02 gagal saat membaca profil error', async () => {
    // Arrange
    loginWith({ users: { error: { message: 'Profil gagal' } } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Profil gagal' });
  });

  test('OCR-03 gagal saat membaca workspace error', async () => {
    // Arrange
    loginWith({ users: { data: { business_id: 'biz-001' } }, businesses: { error: { message: 'Workspace gagal' } } });

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Workspace gagal' });
  });

  test('OCR-04 menolak format gambar yang tidak didukung', async () => {
    // Arrange
    loginWith(noProfile);

    // Act
    const response = await callPost({ imageBase64: 'aGFsbw==', mimeType: 'image/gif' });

    // Assert
    expect(response.status).toBe(400);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  test('OCR-05 gagal saat API key tidak dikonfigurasi', async () => {
    // Arrange
    loginWith(noProfile);
    vi.stubEnv('GEMINI_API_KEY', '');

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'GEMINI_API_KEY tidak dikonfigurasi' });
  });

  test('OCR-06 membaca struk pada workspace pribadi', async () => {
    // Arrange
    loginWith(personal);
    gemini.generateContent.mockResolvedValue(reply(
      '```json\n{"amount":45000,"description":"Makan siang","category":"Makanan & Minuman","date":"2026-11-01","merchant":"Warung"}\n```',
    ));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      amount: 45000, description: 'Makan siang', category: 'Makanan & Minuman', date: '2026-11-01', merchant: 'Warung',
    });
  });

  test('OCR-07 mengisi nilai bawaan saat hasil AI tidak lengkap', async () => {
    // Arrange
    loginWith(business);
    gemini.generateContent.mockResolvedValue(reply('{}'));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      amount: 0, description: 'Transaksi dari struk', category: 'Lainnya', merchant: null,
    });
  });

  test('OCR-08 mengembalikan 422 saat respons AI bukan JSON', async () => {
    // Arrange
    loginWith(business);
    gemini.generateContent.mockResolvedValue(reply('bukan json'));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: 'Gagal parsing respons AI', raw: 'bukan json' });
  });

  test('OCR-09 mencoba model berikutnya saat model tidak tersedia', async () => {
    // Arrange
    loginWith(business);
    gemini.generateContent
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce(reply('{"amount":1000}'));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(200);
    expect(gemini.getGenerativeModel).toHaveBeenCalledTimes(2);
  });

  test('OCR-10 gagal setelah semua model tidak tersedia', async () => {
    // Arrange
    loginWith(business);
    gemini.generateContent.mockRejectedValue(new Error('model not found'));

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'model not found' });
    expect(gemini.getGenerativeModel).toHaveBeenCalledTimes(4);
  });

  test('OCR-11 langsung berhenti pada error selain model tidak tersedia', async () => {
    // Arrange
    loginWith(business);
    gemini.generateContent.mockRejectedValue({});

    // Act
    const response = await callPost();

    // Assert
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Terjadi kesalahan server' });
    expect(gemini.getGenerativeModel).toHaveBeenCalledTimes(1);
  });
});
