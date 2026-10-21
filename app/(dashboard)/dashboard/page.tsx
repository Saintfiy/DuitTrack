'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatCard, Card, Button } from '@/components/ui';
import {
  FiTrendingUp, FiDollarSign, FiBox, FiBarChart2,
  FiArrowRight, FiArrowUpRight, FiArrowDownRight, FiCalendar
} from 'react-icons/fi';
import { formatCurrency, formatCurrencyCompact } from '@/utils/helpers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const TIME_FILTERS = [
  { label: 'Bulan Ini', value: 1 },
  { label: '3 Bulan', value: 3 },
  { label: '6 Bulan', value: 6 },
  { label: '1 Tahun', value: 12 },
];

const CATEGORY_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];

// Premium custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-xl bg-darker/90 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[160px]">
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-white/60 text-xs">{entry.name}</span>
          </div>
          <span className="text-white text-xs font-bold">{formatCurrencyCompact(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, businessId, business, loading: authLoading } = useAuth({ requireAuth: true });
  const isPersonal = business?.workspace_type === 'personal';
  const [timeFilter, setTimeFilter] = useState(6);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const [{ data: txData }, { data: recentData }] = await Promise.all([
      supabase.from('transactions').select('*').eq('business_id', businessId).gte('date', yearStart),
      supabase.from('transactions').select('*').eq('business_id', businessId).order('date', { ascending: false }).limit(5),
    ]);
    const [{ data: invData }, { data: custData }] = isPersonal
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          supabase.from('inventory').select('quantity, unit_price').eq('business_id', businessId),
          supabase.from('customers').select('name, total_purchased, total_transactions').eq('business_id', businessId).order('total_purchased', { ascending: false }).limit(5),
        ]);
    setAllTransactions(txData || []);
    setInventory(invData || []);
    setTopCustomers(custData || []);
    setRecentTransactions(recentData || []);
    setLoading(false);
  }, [businessId, isPersonal]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) { setLoading(false); return; }
    loadDashboardData();
  }, [authLoading, businessId, loadDashboardData]);

  // Filter transactions by timeFilter (months)
  const filteredTransactions = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - timeFilter);
    return allTransactions.filter(t => new Date(t.date) >= cutoff);
  }, [allTransactions, timeFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const inventoryValue = inventory.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    return { totalRevenue, totalExpense, profit: totalRevenue - totalExpense, inventoryValue };
  }, [filteredTransactions, inventory]);

  // Chart data
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: timeFilter }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (timeFilter - 1 - i), 1);
      const inMonth = filteredTransactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const pendapatan = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const pengeluaran = inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { bulan: MONTHS_ID[d.getMonth()], pendapatan, pengeluaran, laba: pendapatan - pengeluaran };
    });
  }, [filteredTransactions, timeFilter]);

  // Category data
  const categoryData = useMemo(() => {
    const expenseTx = filteredTransactions.filter(t => t.type === 'expense');
    const catMap: Record<string, number> = {};
    expenseTx.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    return Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], i) => ({
        name, value: Math.round((value / (total || 1)) * 100), fill: CATEGORY_COLORS[i],
      }));
  }, [filteredTransactions]);

  // Month-over-month revenue change
  const prevMonthRevenue = chartData[chartData.length - 2]?.pendapatan ?? 0;
  const currMonthRevenue = chartData[chartData.length - 1]?.pendapatan ?? 0;
  const revenueChange = prevMonthRevenue > 0 ? ((currMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" hideTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card h-32 animate-pulse bg-white/5 rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" hideTitle>
      <div className="space-y-5 md:space-y-6">

        {/* ─── Welcome Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-white/45 text-[11px] md:text-sm font-semibold uppercase tracking-[0.16em] mb-1.5">
              {isPersonal ? 'Ringkasan Pribadi' : 'Dashboard Bisnis'}
            </p>
            <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {isPersonal ? user?.full_name || user?.email || 'Keuangan Pribadi' : business?.name || 'Bisnis Anda'}
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Link href="/transactions" className="min-w-0">
              <Button variant="primary" size="sm" className="w-full justify-center whitespace-nowrap">
                <FiBarChart2 size={14} /> Tambah Transaksi
              </Button>
            </Link>
            <Link href="/ai-assistant" className="min-w-0">
              <Button variant="secondary" size="sm" className="w-full justify-center whitespace-nowrap">
                Tanya AI <FiArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ─── Time Filter Bar ─── */}
        <div className="space-y-2 md:flex md:items-center md:gap-2 md:space-y-0">
          <div className="flex items-center gap-1.5 text-white/40 text-xs md:mr-1">
            <FiCalendar size={12} />
            <span className="uppercase tracking-wider font-semibold">Rentang:</span>
          </div>
          <div className="grid grid-cols-4 gap-2 md:flex">
            {TIME_FILTERS.map(f => (
              <motion.button
                key={f.value}
                layout
                onClick={() => setTimeFilter(f.value)}
                className={`rounded-xl px-2 py-2 text-xs md:px-4 md:py-1.5 md:text-sm font-semibold transition-all duration-200 ${
                  timeFilter === f.value
                    ? 'bg-primary text-darker shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ─── KPI Stat Cards ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={timeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`grid grid-cols-2 ${isPersonal ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 md:gap-4`}
          >
            <StatCard
              label={isPersonal ? 'Total Pemasukan' : 'Total Pendapatan'}
              value={formatCurrency(stats.totalRevenue)}
              compact={formatCurrencyCompact(stats.totalRevenue)}
              icon={<FiDollarSign />}
              change={revenueChange}
              trend={revenueChange >= 0 ? 'up' : 'down'}
              color="green"
            />
            <StatCard
              label="Total Pengeluaran"
              value={formatCurrency(stats.totalExpense)}
              compact={formatCurrencyCompact(stats.totalExpense)}
              icon={<FiArrowDownRight />}
              color="red"
            />
            <StatCard
              label={isPersonal ? 'Selisih Bersih' : 'Laba Bersih'}
              value={formatCurrency(stats.profit)}
              compact={formatCurrencyCompact(stats.profit)}
              icon={<FiTrendingUp />}
              color={stats.profit >= 0 ? 'primary' : 'secondary'}
              className={isPersonal ? 'col-span-2 lg:col-span-1' : ''}
              wide={isPersonal}
            />
            {!isPersonal && (
              <StatCard
                label="Nilai Inventori"
                value={formatCurrency(stats.inventoryValue)}
                compact={formatCurrencyCompact(stats.inventoryValue)}
                icon={<FiBox />}
                color="accent"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {stats.totalRevenue === 0 && stats.totalExpense === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-10 md:py-16">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">📊</div>
            <h3 className="text-lg md:text-xl font-bold mb-2">Belum ada data transaksi</h3>
            <p className="max-w-md mx-auto text-white/50 mb-5 md:mb-6 text-sm">Catat pemasukan atau pengeluaran pertama untuk melihat ringkasan dan tren keuangan Anda.</p>
            <Link href="/transactions">
              <Button variant="primary" size="sm">Tambah Transaksi <FiArrowRight /></Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* ─── Premium Area Chart ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Tren Keuangan</h3>
                  <p className="text-white/40 text-xs mt-0.5">{isPersonal ? 'Pemasukan & Pengeluaran' : 'Pendapatan & Pengeluaran'}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-primary inline-block" /> {isPersonal ? 'Pemasukan' : 'Pendapatan'}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-secondary inline-block" /> Pengeluaran</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPendapatan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="bulan" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} />
                  <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="pendapatan" name={isPersonal ? 'Pemasukan' : 'Pendapatan'} stroke="#8B5CF6" strokeWidth={2.5} fill="url(#gradPendapatan)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#8B5CF6' }} />
                  <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#EC4899" strokeWidth={2.5} fill="url(#gradPengeluaran)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#EC4899' }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ─── Bottom Grid ─── */}
            <div className={`grid grid-cols-1 ${isPersonal ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 md:gap-6`}>
              {/* Kategori Pengeluaran */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h3 className="text-lg font-bold mb-5">Kategori Pengeluaran</h3>
                {categoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {categoryData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v: number) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {categoryData.map(cat => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.fill }} />
                            <span className="text-white/60 truncate">{cat.name}</span>
                          </div>
                          <span className="font-bold ml-2">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-white/40 text-sm text-center py-10">Belum ada data pengeluaran.</p>
                )}
              </motion.div>

              {/* Transaksi Terbaru */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold">Transaksi Terbaru</h3>
                  <Link href="/transactions"><Button variant="secondary" size="sm">Lihat Semua</Button></Link>
                </div>
                {recentTransactions.length === 0 ? (
                  <p className="text-white/40 text-sm py-6 text-center">Belum ada transaksi.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recentTransactions.map((tx, idx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${tx.type === 'income' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {tx.type === 'income' ? <FiArrowUpRight size={16} /> : <FiArrowDownRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight truncate max-w-[120px]">{tx.description}</p>
                            <p className="text-xs text-white/35 mt-0.5">{tx.category}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrencyCompact(tx.amount)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Pelanggan Teratas */}
              {!isPersonal && <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold">Pelanggan Teratas</h3>
                  <Link href="/crm"><Button variant="secondary" size="sm">Lihat Semua</Button></Link>
                </div>
                {topCustomers.length === 0 ? (
                  <p className="text-white/40 text-sm py-6 text-center">Belum ada data pelanggan.</p>
                ) : (
                  <div className="space-y-1.5">
                    {topCustomers.map((customer, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight truncate max-w-[110px]">{customer.name}</p>
                            <p className="text-xs text-white/35 mt-0.5">{customer.total_transactions} transaksi</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-accent flex-shrink-0">{formatCurrencyCompact(customer.total_purchased)}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
