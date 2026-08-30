'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button } from '@/components/ui';
import { FiDownload, FiFileText, FiTrendingUp, FiDollarSign, FiBox } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/helpers';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function ReportsPage() {
  const { businessId, business, loading: authLoading } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [report, setReport] = useState<any>({ income: 0, expense: 0, profit: 0, margin: 0, topCategories: [], topItems: [] });

  const loadReport = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const now = new Date();
    let start: Date;
    if (period === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else start = new Date(now.getFullYear(), 0, 1);

    const [{ data: txData }, { data: invData }] = await Promise.all([
      supabase.from('transactions').select('*').eq('business_id', businessId).gte('date', start.toISOString()),
      supabase.from('inventory').select('name,quantity,unit_price').eq('business_id', businessId).order('quantity', { ascending: true }).limit(5),
    ]);

    const transactions = txData || [];
    const income = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    const catMap: Record<string, number> = {};
    transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const topCategories = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, amount]) => ({ name, amount }));

    setReport({ income, expense, profit, margin, topCategories, topItems: invData || [] });
    setLoading(false);
  }, [businessId, period]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) { setLoading(false); return; }
    loadReport();
  }, [authLoading, businessId, period, loadReport]);

  const exportCSV = () => {
    const rows = [
      ['Laporan Keuangan DuitTrack'],
      [`Bisnis: ${business?.name || ''}`],
      [`Periode: ${period === 'month' ? 'Bulan Ini' : period === 'quarter' ? 'Kuartal Ini' : 'Tahun Ini'}`],
      [],
      ['Metrik', 'Nilai'],
      ['Total Pendapatan', report.income],
      ['Total Pengeluaran', report.expense],
      ['Laba Bersih', report.profit],
      ['Margin Keuntungan', `${report.margin.toFixed(1)}%`],
      [],
      ['Kategori Pengeluaran Terbesar', 'Jumlah'],
      ...report.topCategories.map((c: any) => [c.name, c.amount]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `laporan-duittrack-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    addNotification('Laporan CSV berhasil diunduh', 'success');
  };

  const printPDF = () => { window.print(); };

  const periodLabel = period === 'month' ? `${MONTHS_ID[new Date().getMonth()]} ${new Date().getFullYear()}` : period === 'quarter' ? `Kuartal ${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}` : `Tahun ${new Date().getFullYear()}`;

  return (
    <DashboardLayout title="Laporan Keuangan">
      <div className="space-y-6">
        {/* Period selector + Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['month', 'quarter', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${period === p ? 'bg-primary text-darker' : 'text-white/60 hover:text-white'}`}>
                {p === 'month' ? 'Bulan Ini' : p === 'quarter' ? 'Kuartal Ini' : 'Tahun Ini'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}><FiDownload size={14} /> Export Excel/CSV</Button>
            <Button variant="secondary" size="sm" onClick={printPDF}><FiFileText size={14} /> Export PDF</Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 text-center text-black">
          <h1 className="text-3xl font-bold">Laporan Keuangan DuitTrack</h1>
          <p className="mt-1">{business?.name}  {periodLabel}</p>
          <p className="text-sm">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6 print:mb-8">
              {[
                { label: 'Total Pendapatan', value: formatCurrency(report.income), icon: FiDollarSign, color: 'text-green-400' },
                { label: 'Total Pengeluaran', value: formatCurrency(report.expense), icon: FiTrendingUp, color: 'text-red-400' },
                { label: 'Laba Bersih', value: formatCurrency(report.profit), icon: FiTrendingUp, color: report.profit >= 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'Margin Keuntungan', value: `${report.margin.toFixed(1)}%`, icon: FiBox, color: report.margin >= 20 ? 'text-green-400' : 'text-yellow-400' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card hover={false}>
                    <p className="text-xs text-white/60 mb-1">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* P&L Statement */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card hover={false}>
                <h3 className="text-lg font-bold mb-4">Laporan Laba Rugi  {periodLabel}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/70">Pendapatan Kotor</span>
                    <span className="font-semibold text-green-400">+ {formatCurrency(report.income)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/70">Total Pengeluaran</span>
                    <span className="font-semibold text-red-400">- {formatCurrency(report.expense)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-white/20 mt-2">
                    <span className="font-bold text-lg">Laba Bersih</span>
                    <span className={`font-black text-xl ${report.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{report.profit >= 0 ? '+' : ''}{formatCurrency(report.profit)}</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Top Expense Categories */}
            {report.topCategories.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card hover={false}>
                  <h3 className="text-lg font-bold mb-4">Top Kategori Pengeluaran</h3>
                  <div className="space-y-3">
                    {report.topCategories.map((cat: any, i: number) => {
                      const pct = report.expense > 0 ? (cat.amount / report.expense) * 100 : 0;
                      const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'];
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cat.name}</span>
                            <span className="font-semibold">{formatCurrency(cat.amount)} <span className="text-white/40 text-xs">({pct.toFixed(0)}%)</span></span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {report.income === 0 && report.expense === 0 && (
              <Card hover={false}><p className="text-center text-white/40 py-8">Belum ada transaksi pada periode ini.</p></Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
