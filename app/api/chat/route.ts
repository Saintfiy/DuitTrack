import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Prepare System Prompt with Context
    const systemPrompt = `Anda adalah Asisten Keuangan DuitTrack, asisten AI cerdas untuk membantu UMKM menganalisis keuangan mereka.
Anda harus memberikan jawaban yang ringkas, profesional, mudah dipahami, dan memberikan *actionable insights*.
Jawab dalam bahasa Indonesia yang natural. Format teks menggunakan Markdown (bold, list, dll).

Konteks Keuangan Pengguna Saat Ini:
- Total Pendapatan: Rp ${context.totalRevenue?.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${context.totalExpense?.toLocaleString('id-ID')}
- Laba Keseluruhan: Rp ${context.profit?.toLocaleString('id-ID')}
- Margin: ${context.margin?.toFixed(2)}%
- Pendapatan Bulan Ini: Rp ${context.monthRevenue?.toLocaleString('id-ID')}
- Pengeluaran Bulan Ini: Rp ${context.monthExpense?.toLocaleString('id-ID')}
- Laba Bulan Ini: Rp ${context.monthProfit?.toLocaleString('id-ID')}
- Total Piutang (belum dibayar orang): Rp ${context.totalReceivable?.toLocaleString('id-ID')}
- Total Hutang (belum dibayar pengguna): Rp ${context.totalPayable?.toLocaleString('id-ID')}
- Item Stok Kritis: ${context.lowStock?.map((i: any) => `${i.name} (${i.quantity} sisa)`).join(', ') || 'Aman'}
- Tagihan Jatuh Tempo: ${context.overdueDebts?.length || 0} tagihan.

Jika data di atas 0 atau kosong, asumsikan pengguna belum mencatat transaksi tersebut.
Bantu analisis berdasarkan data di atas jika ditanya. Jika pengguna menyapa, sapa balik dengan ramah.`;

    // Map messages for OpenRouter (role: user/assistant/system)
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content
      }))
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://duittrack.com', // Required by OpenRouter
        'X-Title': 'DuitTrack App', // Optional for OpenRouter
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5', // Fast, cheap, and smart default
        messages: formattedMessages,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from OpenRouter' }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract the reply
    const reply = data.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat merespons saat ini.';
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
