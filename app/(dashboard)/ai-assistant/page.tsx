'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui';
import { FiSend, FiZap, FiRefreshCw, FiCpu } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/helpers';

type Role = 'user' | 'ai';
interface Msg { role: Role; content: string; ts: number }

const QUICK = [
  'Kondisi keuangan bisnis saya?',
  'Pengeluaran terbesar bulan ini?',
  'Berapa laba bersih saya?',
  'Item stok yang hampir habis?',
  'Tips hemat biaya operasional',
  'Status hutang & piutang',
  'Berapa rata-rata transaksi saya?',
  'Prediksi cashflow bulan depan',
  'Bagaimana cara tingkatkan profit?',
  'Apakah bisnis saya untung?',
];

function smartReply(msg: string, ctx: ReturnType<typeof buildContext> extends Promise<infer T> ? T : never): string {
  const q = msg.toLowerCase();
  const { totalRevenue, totalExpense, profit, margin, monthRevenue, monthExpense, monthProfit,
    txCount, topCats, lowStock, inventory, overdueDebts, totalReceivable, totalPayable, budgets } = ctx;

  if (txCount === 0) return '📭 Belum ada data transaksi.\n\nMulai dengan:\n• Buka menu **Transaksi** → Tambah transaksi\n• Atau gunakan **Scan Struk** untuk catat langsung dari foto\n\nSetelah ada data, saya bisa bantu analisis keuangan bisnis Anda secara detail.';

  const healthScore = margin >= 25 ? 90 : margin >= 15 ? 75 : margin >= 5 ? 55 : margin >= 0 ? 35 : 15;
  const healthLabel = healthScore >= 80 ? '🟢 Sangat Sehat' : healthScore >= 60 ? '🟡 Cukup Sehat' : healthScore >= 40 ? '🟠 Perlu Perhatian' : '🔴 Kritis';

  // ---- KONDISI UMUM / OVERVIEW ----
  if (q.match(/kondisi|kesehatan|gimana|bagaimana|sehat|overview|summary|ringkasan|status bisnis/)) {
    const issues: string[] = [];
    const positives: string[] = [];
    if (margin < 10) issues.push(`Margin keuntungan rendah (${margin.toFixed(1)}%)`);
    if (lowStock.length > 0) issues.push(`${lowStock.length} item stok hampir habis`);
    if (overdueDebts.length > 0) issues.push(`${overdueDebts.length} tagihan jatuh tempo belum dibayar`);
    if (totalPayable > totalReceivable) issues.push(`Hutang (${formatCurrency(totalPayable)}) melebihi piutang`);
    if (margin >= 20) positives.push('Margin keuntungan sehat');
    if (monthProfit > 0) positives.push('Bulan ini menguntungkan');
    if (overdueDebts.length === 0) positives.push('Tidak ada tagihan jatuh tempo');

    return `**Status Bisnis: ${healthLabel}** (Skor ${healthScore}/100)\n\n📊 Keseluruhan:\n• Pendapatan: ${formatCurrency(totalRevenue)}\n• Pengeluaran: ${formatCurrency(totalExpense)}\n• Laba Bersih: ${formatCurrency(profit)}\n• Margin: ${margin.toFixed(1)}%\n\n📅 Bulan Ini:\n• Pendapatan: ${formatCurrency(monthRevenue)}\n• Pengeluaran: ${formatCurrency(monthExpense)}\n• Laba: ${formatCurrency(monthProfit)}\n${positives.length > 0 ? '\n✅ Poin Positif:\n' + positives.map(p => '• ' + p).join('\n') : ''}${issues.length > 0 ? '\n\n⚠️ Perlu Diperhatikan:\n' + issues.map(i => '• ' + i).join('\n') : '\n\n✅ Semua indikator dalam kondisi baik!'}`;
  }

  // ---- LABA / PROFIT ----
  if (q.match(/laba|profit|untung|keuntungan|rugi|margin/)) {
    const trend = monthProfit > 0 ? '📈 Bulan ini profitable' : '📉 Bulan ini masih merugi';
    const advice = margin >= 25
      ? 'Margin sangat baik! Pertimbangkan reinvestasi ke ekspansi produk atau buka cabang baru.'
      : margin >= 15
      ? 'Margin sehat. Fokus pertahankan efisiensi dan cari peluang upsell ke pelanggan existing.'
      : margin >= 5
      ? 'Margin tipis. Review harga jual — apakah sudah mencakup semua biaya + profit yang diinginkan?'
      : margin >= 0
      ? 'Hampir impas. Prioritaskan potong 1-2 biaya terbesar dan pertimbangkan naikkan harga.'
      : 'Bisnis sedang merugi. Segera identifikasi biaya terbesar dan evaluasi harga jual produk.';
    return `**Analisis Laba Bisnis:**\n\n• Laba keseluruhan: ${formatCurrency(profit)}\n• Laba bulan ini: ${formatCurrency(monthProfit)}\n• Margin keuntungan: ${margin.toFixed(1)}%\n• ${trend}\n\n💡 **Saran:** ${advice}`;
  }

  // ---- PENGELUARAN ----
  if (q.match(/pengeluaran|biaya|expense|terbesar|kategori|cost/)) {
    if (topCats.length === 0) return 'Belum ada data pengeluaran tercatat. Tambahkan transaksi pengeluaran terlebih dahulu.';
    const list = topCats.map(([cat, amt], i) => `${i + 1}. **${cat}**: ${formatCurrency(amt)} (${totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(0) : 0}%)`).join('\n');
    const top = topCats[0];
    const potentialSave = top[1] * 0.15;
    return `**Top Kategori Pengeluaran:**\n\n${list}\n\n💡 **Pengeluaran terbesar: ${top[0]}** (${formatCurrency(top[1])})\nJika bisa hemat 15% saja di kategori ini, bisnis bisa simpan **${formatCurrency(potentialSave)}/periode**.\n\nCoba: negosiasi ulang kontrak vendor, bandingkan harga supplier, atau cari alternatif lebih hemat.`;
  }

  // ---- PENDAPATAN ----
  if (q.match(/pendapatan|pemasukan|revenue|omset|omzet/)) {
    const avgPerTx = txCount > 0 ? totalRevenue / Math.max(txCount, 1) : 0;
    const incomeTx = txCount;
    return `**Analisis Pendapatan:**\n\n• Total pendapatan: ${formatCurrency(totalRevenue)}\n• Bulan ini: ${formatCurrency(monthRevenue)}\n• Rata-rata per transaksi: ${formatCurrency(avgPerTx)}\n• Total transaksi: ${incomeTx}\n\n💡 **Tips Tingkatkan Pendapatan:**\n• Fokus ke pelanggan dengan nilai transaksi tinggi (lihat halaman Pelanggan)\n• Tambah produk/layanan komplementer untuk upsell\n• Aktifkan program loyalitas untuk pelanggan repeat`;
  }

  // ---- RATA-RATA TRANSAKSI ----
  if (q.match(/rata.rata|average|per transaksi/)) {
    const avg = txCount > 0 ? totalRevenue / txCount : 0;
    return `**Rata-rata Transaksi:**\n\n• Rata-rata nilai: ${formatCurrency(avg)}\n• Total transaksi: ${txCount}\n• Total pendapatan: ${formatCurrency(totalRevenue)}\n\n💡 Untuk meningkatkan rata-rata transaksi, coba teknik **upselling** (tawarkan produk premium) atau **bundling** (paket produk dengan harga spesial).`;
  }

  // ---- STOK / INVENTORI ----
  if (q.match(/stok|inventori|barang|produk|restock|kritis|habis|sediaan/)) {
    if (inventory.length === 0) return '📦 Belum ada data inventori. Tambahkan item di menu **Inventori** untuk mulai pantau stok.';
    if (lowStock.length === 0) return `✅ Semua ${inventory.length} item stok dalam kondisi aman. Tidak ada yang perlu segera di-restock.`;
    const list = lowStock.slice(0, 5).map((i: any) => `• **${i.name}**: sisa ${i.quantity} unit (min. ${i.reorder_level})`).join('\n');
    const urgentCount = lowStock.filter((i: any) => i.quantity === 0).length;
    return `**⚠️ ${lowStock.length} Item Stok Kritis:**\n\n${list}${lowStock.length > 5 ? `\n• ...dan ${lowStock.length - 5} item lainnya` : ''}\n\n${urgentCount > 0 ? `🚨 **${urgentCount} item sudah HABIS** — bisa menyebabkan kehilangan penjualan!\n\n` : ''}💡 Buka halaman **Inventori** untuk langsung update stok atau hubungi supplier.`;
  }

  // ---- HUTANG PIUTANG ----
  if (q.match(/hutang|piutang|tagihan|jatuh tempo|overdue|kredit|pinjam/)) {
    const net = totalReceivable - totalPayable;
    const overdueList = overdueDebts.slice(0, 3).map((d: any) => `• ${d.customer_name}: ${formatCurrency(d.amount)}`).join('\n');
    return `**Ringkasan Hutang & Piutang:**\n\n💰 Piutang (akan diterima): ${formatCurrency(totalReceivable)}\n📤 Hutang (kewajiban): ${formatCurrency(totalPayable)}\n📊 Posisi bersih: ${net >= 0 ? '+' : ''}${formatCurrency(net)} ${net >= 0 ? '✅' : '⚠️'}\n⏰ Jatuh tempo: ${overdueDebts.length} item${overdueDebts.length > 0 ? '\n\n**Segera tagih:**\n' + overdueList + '\n\n💡 Hubungi debitur yang sudah jatuh tempo. Piutang yang tertunggak = modal yang tidak bekerja.' : '\n\n✅ Semua kewajiban dalam jadwal.'}`;
  }

  // ---- CASHFLOW ----
  if (q.match(/cashflow|arus kas|likuiditas|kas|prediksi|bulan depan|forecast/)) {
    const avgMonthlyRevenue = monthRevenue;
    const avgMonthlyExpense = monthExpense;
    const projectedProfit = avgMonthlyRevenue - avgMonthlyExpense;
    const netCash = totalRevenue - totalExpense;
    return `**Analisis Cashflow:**\n\n• Net cashflow saat ini: ${formatCurrency(netCash)} ${netCash >= 0 ? '✅' : '⚠️'}\n• Pendapatan bulan ini: ${formatCurrency(monthRevenue)}\n• Pengeluaran bulan ini: ${formatCurrency(monthExpense)}\n• Proyeksi bulan depan: ${formatCurrency(projectedProfit)} (estimasi berdasarkan tren)\n\n💰 Likuiditas:\n• Piutang bisa cairkan: ${formatCurrency(totalReceivable)}\n• Kewajiban jatuh tempo: ${formatCurrency(totalPayable)}\n\n💡 Buka halaman **Cashflow** untuk visualisasi tren 6 bulan.`;
  }

  // ---- HEMAT / REKOMENDASI / TIPS ----
  if (q.match(/hemat|potong|efisiensi|rekomendasi|saran|tips|improve|tingkat|naik/)) {
    const top3 = topCats.slice(0, 3).map(([c, a]) => `**${c}** (${formatCurrency(a)})`).join(', ');
    const hasLowMargin = margin < 15;
    return `**💡 Rekomendasi untuk Bisnis Anda:**\n\n1. **Efisiensi Pengeluaran** — Pengeluaran terbesar: ${top3 || 'belum ada data'}. Review vendor & negosiasi ulang kontrak.\n\n2. **Tagih Piutang** — Ada ${formatCurrency(totalReceivable)} yang bisa segera dicairkan untuk perkuat cashflow.\n\n3. **Pantau Budget** — Aktifkan limit budget di halaman **Budgeting** agar pengeluaran tidak kebablasan.\n\n4. **Optimasi Stok** — ${lowStock.length > 0 ? `${lowStock.length} item hampir habis, segera restock sebelum kehabisan.` : 'Stok aman, hindari overstock yang ikat modal tidak perlu.'}\n\n5. ${hasLowMargin ? '**Evaluasi Harga Jual** — Margin hanya ' + margin.toFixed(1) + '%. Pertimbangkan naikkan harga 5-10% atau kurangi diskon.' : '**Ekspansi** — Margin ' + margin.toFixed(1) + '% cukup sehat. Pertimbangkan tambah lini produk baru atau buka cabang.'}`;
  }

  // ---- PELANGGAN ----
  if (q.match(/pelanggan|customer|klien|pembeli/)) {
    return `**Tips Manajemen Pelanggan:**\n\n💡 Buka halaman **Pelanggan (CRM)** untuk:\n• Lihat siapa pelanggan dengan nilai transaksi terbesar\n• Pantau pelanggan yang sudah lama tidak bertransaksi\n• Catat kontak dan histori pembelian\n\n📌 Strategi retensi:\n• Hubungi pelanggan VIP secara personal\n• Buat program loyalitas atau diskon repeat order\n• Follow-up pelanggan yang belum bertransaksi >30 hari`;
  }

  // ---- BUDGET ----
  if (q.match(/budget|anggaran|limit|batas/)) {
    if (budgets.length === 0) return '📋 Belum ada budget yang diatur.\n\n💡 Buka halaman **Budgeting** untuk:\n• Set batas pengeluaran per kategori\n• Pantau realisasi vs anggaran\n• Dapat peringatan saat mendekati batas';
    const budgetList = budgets.slice(0, 4).map((b: any) => `• ${b.category}: limit ${formatCurrency(b.limit_amount)} (${b.period})`).join('\n');
    return `**Budget yang Aktif:**\n\n${budgetList}\n\n💡 Cek realisasi vs anggaran di halaman **Budgeting** untuk pastikan pengeluaran on-track.`;
  }

  // ---- FALLBACK: jawab pertanyaan bebas ----
  const hasData = txCount > 0;
  return `Saya asisten keuangan bisnis Anda. Berdasarkan **${txCount} transaksi** yang tercatat, ini yang bisa saya bantu:\n\n📊 **Analisis Tersedia:**\n• Kondisi & kesehatan bisnis secara keseluruhan\n• Laba, margin, dan tren keuntungan\n• Kategori pengeluaran terbesar\n• Status hutang & piutang\n• Stok inventori kritis\n• Cashflow & prediksi keuangan\n• Rekomendasi hemat biaya\n\n💬 Coba tanyakan salah satu topik di atas, atau klik pertanyaan cepat di bawah!`;
}

async function buildContext(businessId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: txAll }, { data: txMonth }, { data: inv }, { data: debts }, { data: budgets }] = await Promise.all([
    supabase.from('transactions').select('type,amount,category,date').eq('business_id', businessId),
    supabase.from('transactions').select('type,amount,category').eq('business_id', businessId).gte('date', monthStart),
    supabase.from('inventory').select('name,quantity,reorder_level,unit_price').eq('business_id', businessId),
    supabase.from('debts').select('type,amount,status,customer_name,due_date').eq('business_id', businessId),
    supabase.from('budgets').select('category,limit_amount,period').eq('business_id', businessId),
  ]);

  const allTx = txAll || [];
  const monthTx = txMonth || [];

  const totalRevenue = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthRevenue = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catMap: Record<string, number> = {};
  allTx.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCats = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 5);

  const lowStock = (inv || []).filter(i => i.quantity <= i.reorder_level);
  const overdueDebts = (debts || []).filter(d => d.status === 'overdue');
  const totalReceivable = (debts || []).filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
  const totalPayable = (debts || []).filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);

  return {
    totalRevenue, totalExpense, profit: totalRevenue - totalExpense,
    margin: totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue * 100) : 0,
    monthRevenue, monthExpense, monthProfit: monthRevenue - monthExpense,
    txCount: allTx.length, topCats,
    lowStock, inventory: inv || [],
    overdueDebts, totalReceivable, totalPayable,
    budgets: budgets || [],
  };
}


export default function AIAssistantPage() {
  const { businessId, loading: authLoading } = useAuth({ requireAuth: true });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [ctx, setCtx] = useState<any>(null);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadCtx = useCallback(async () => {
    if (!businessId) return;
    setLoadingCtx(true);
    const data = await buildContext(businessId);
    setCtx(data);
    setLoadingCtx(false);
  }, [businessId]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) { setLoadingCtx(false); return; }
    loadCtx();
  }, [authLoading, businessId, loadCtx]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const send = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || typing || !ctx) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: q, ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setTyping(true);

    try {
      // Create a payload with the chat history + current message
      // We pass the entire current msgs array so the model has memory of the conversation.
      const payloadMsgs = [...msgs, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMsgs, context: ctx })
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi AI Server');
      }

      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'ai', content: data.reply, ts: Date.now() }]);
    } catch (err: any) {
      console.error(err);
      setMsgs(prev => [...prev, { role: 'ai', content: '⚠️ Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.', ts: Date.now() }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, ctx, msgs]);

  const renderContent = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-primary mb-1">{line.slice(2, -2)}</p>;
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: boldLine || '&nbsp;' }} />;
    });

  return (
    <DashboardLayout title="Asisten Keuangan AI">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
        {/* Chat */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="card flex flex-col gap-3 overflow-y-auto" style={{ minHeight: 400, maxHeight: '60vh' }}>
            {msgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <FiCpu size={28} className="text-primary" />
                </div>
                <p className="font-semibold">Asisten Keuangan AI</p>
                <p className="text-sm text-white/50 mt-1">{loadingCtx ? 'Memuat data bisnis...' : 'Tanyakan apa saja tentang keuangan Anda'}</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {msgs.map(m => (
                <motion.div key={m.ts} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm space-y-0.5 ${m.role === 'user' ? 'bg-primary text-darker rounded-br-sm font-medium' : 'bg-white/10 rounded-bl-sm'}`}>
                    {m.role === 'ai' ? renderContent(m.content) : <p>{m.content}</p>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {typing && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-white/10 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0,1,2].map(i => <motion.div key={i} className="w-1.5 h-1.5 bg-white/50 rounded-full" animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (Always visible) */}
          {!loadingCtx && (
            <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} className="flex-shrink-0 text-xs px-3 py-2 border border-white/15 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-smooth">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={loadingCtx ? 'Memuat data...' : 'Tanya tentang keuangan Anda...'}
              disabled={loadingCtx} className="input-field flex-1 text-sm" />
            <Button variant="primary" onClick={() => send()} disabled={!input.trim() || typing || loadingCtx}><FiSend size={16} /></Button>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><FiZap className="text-accent" /><h3 className="font-bold">Insight Cepat</h3></div>
            <button onClick={loadCtx} className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth"><FiRefreshCw size={13} className={loadingCtx ? 'animate-spin' : ''} /></button>
          </div>

          {!loadingCtx && ctx ? (
            <>
              {[
                { label: 'Laba Bersih', val: formatCurrency(ctx.profit), color: ctx.profit >= 0 ? 'text-green-400' : 'text-red-400', sub: `Margin ${ctx.margin.toFixed(1)}%` },
                { label: 'Pendapatan Bulan Ini', val: formatCurrency(ctx.monthRevenue), color: 'text-primary', sub: `vs pengeluaran ${formatCurrency(ctx.monthExpense)}` },
                { label: 'Piutang Belum Tertagih', val: formatCurrency(ctx.totalReceivable), color: 'text-yellow-400', sub: `Hutang: ${formatCurrency(ctx.totalPayable)}` },
              ].map(item => (
                <div key={item.label} className="card">
                  <p className="text-xs text-white/50 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                </div>
              ))}
              {ctx.lowStock.length > 0 && (
                <div className="card border border-red-500/30 bg-red-500/10">
                  <p className="text-xs font-semibold text-red-400 mb-1">⚠️ {ctx.lowStock.length} Item Stok Kritis</p>
                  {ctx.lowStock.slice(0, 3).map((i: any) => <p key={i.name} className="text-xs text-white/60 truncate">• {i.name} ({i.quantity} unit)</p>)}
                </div>
              )}
              {ctx.overdueDebts.length > 0 && (
                <div className="card border border-yellow-500/30 bg-yellow-500/10">
                  <p className="text-xs font-semibold text-yellow-400 mb-1">🕐 {ctx.overdueDebts.length} Tagihan Jatuh Tempo</p>
                  {ctx.overdueDebts.slice(0, 2).map((d: any) => <p key={d.customer_name} className="text-xs text-white/60 truncate">• {d.customer_name}</p>)}
                </div>
              )}
              {ctx.topCats[0] && (
                <div className="card">
                  <p className="text-xs text-white/50 mb-1">Pengeluaran Terbesar</p>
                  <p className="font-semibold text-sm">{ctx.topCats[0][0]}</p>
                  <p className="text-primary text-sm font-bold">{formatCurrency(ctx.topCats[0][1])}</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
