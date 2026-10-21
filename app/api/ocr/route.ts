import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUser } from '@/lib/authenticated-request';

const CATEGORIES = ['Operasional', 'Perlengkapan', 'Gaji', 'Sewa', 'Marketing', 'Lainnya'];
const PERSONAL_CATEGORIES = ['Makanan & Minuman', 'Tagihan', 'Transportasi', 'Belanja', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Lainnya'];

// Urutan model: lite dulu (quota terpisah), baru yang besar
const MODEL_PRIORITY = [
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash',
];

export async function POST(req: NextRequest) {
  try {
    const auth = await getUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { imageBase64, mimeType } = await req.json();

    const { data: profile, error: profileError } = await auth.client
      .from('users')
      .select('business_id')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    let workspaceType: 'business' | 'personal' = 'business';
    if (profile?.business_id) {
      const { data: workspace, error: workspaceError } = await auth.client
        .from('businesses')
        .select('workspace_type')
        .eq('id', profile.business_id)
        .maybeSingle();
      if (workspaceError) throw workspaceError;
      if (workspace?.workspace_type === 'personal') workspaceType = 'personal';
    }
    const categories = workspaceType === 'personal' ? PERSONAL_CATEGORIES : CATEGORIES;

    if (
      typeof imageBase64 !== 'string'
      || imageBase64.length > 12_000_000
      || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)
    ) {
      return NextResponse.json(
        { error: 'Gambar wajib berupa JPEG, PNG, atau WebP dan berukuran maksimal 9 MB' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak dikonfigurasi' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Kamu adalah asisten OCR untuk struk belanja/pembayaran ${workspaceType === 'personal' ? 'pribadi' : 'bisnis'} Indonesia.
Analisis gambar struk ini dan ekstrak informasi berikut dalam format JSON.

Instruksi:
- "amount": total pembayaran dalam angka integer (tanpa titik/koma pemisah), contoh: 45000
- "description": deskripsi singkat transaksi dalam Bahasa Indonesia (maks 60 karakter), contoh: "Pembelian ATK di Gramedia"
- "category": pilih SATU dari kategori berikut yang paling sesuai: ${categories.join(', ')}
- "date": tanggal transaksi dalam format YYYY-MM-DD. Jika tidak ada tanggal, gunakan hari ini: ${new Date().toISOString().split('T')[0]}
- "merchant": nama toko/merchant jika ada, atau null

Jika gambar bukan struk atau tidak terbaca, kembalikan error.

Balas HANYA dengan JSON murni tanpa markdown, tanpa penjelasan:
{"amount": 0, "description": "", "category": "", "date": "", "merchant": ""}`;

    let lastError: any = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ]);

        const text = result.response.text().trim();

        // Bersihkan markdown code block jika ada
        const cleaned = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          return NextResponse.json({ error: 'Gagal parsing respons AI', raw: cleaned }, { status: 422 });
        }

        // Validasi & sanitasi
        const amount = Math.abs(Number(parsed.amount) || 0);
        const description = String(parsed.description || 'Transaksi dari struk').slice(0, 120);
        const category = categories.includes(parsed.category) ? parsed.category : 'Lainnya';
        const date = /^\d{4}-\d{2}-\d{2}$/.test(parsed.date ?? '')
          ? parsed.date
          : new Date().toISOString().split('T')[0];
        const merchant = parsed.merchant ? String(parsed.merchant) : null;

        console.log(`[OCR] Model used: ${modelName}`);
        return NextResponse.json({ amount, description, category, date, merchant });

      } catch (err: any) {
        lastError = err;
        // Jika 503 atau 404 → coba model berikutnya
        const msg: string = err?.message ?? '';
        if (msg.includes('503') || msg.includes('503') || msg.includes('not found') || msg.includes('404')) {
          console.warn(`[OCR] Model ${modelName} unavailable, trying next...`);
          continue;
        }
        // Error lain (misal quota habis) → langsung lempar
        throw err;
      }
    }

    // Semua model gagal
    throw lastError ?? new Error('Semua model Gemini tidak tersedia saat ini');

  } catch (err: any) {
    console.error('[OCR Route Error]', err);
    return NextResponse.json({ error: err.message ?? 'Terjadi kesalahan server' }, { status: 500 });
  }
}
