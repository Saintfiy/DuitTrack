'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button, Modal, PriceInput } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/helpers';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Operasional', 'Perlengkapan', 'Gaji', 'Sewa', 'Marketing', 'Lainnya'];

const emptyForm = { category: 'Operasional', limit_amount: '', period: 'monthly' as 'monthly' | 'quarterly' | 'yearly', start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' };

export default function BudgetingPage() {
  const { businessId, loading: authLoading } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchBudgets = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [{ data: budgetData }, { data: txData }] = await Promise.all([
      supabase.from('budgets').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('category, amount').eq('business_id', businessId).eq('type', 'expense').gte('date', monthStart),
    ]);
    const spentMap: Record<string, number> = {};
    (txData || []).forEach((t: any) => { spentMap[t.category] = (spentMap[t.category] || 0) + t.amount; });
    const enriched = (budgetData || []).map((b: any) => ({ ...b, spent: spentMap[b.category] || 0 }));
    setBudgets(enriched);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) { setLoading(false); return; }
    fetchBudgets();
  }, [authLoading, businessId, fetchBudgets]);

  const totalLimit = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter(b => b.spent > b.limit_amount).length;

  const getEndDate = (start: string, period: string) => {
    const d = new Date(start);
    if (period === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (period === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    const notes = form.notes.trim();
    if (notes.length < 1 || notes.length > 100) {
      addNotification('Catatan budget wajib diisi 1–100 karakter', 'error');
      return;
    }
    setSaving(true);
    try {
      const endDate = form.end_date || getEndDate(form.start_date, form.period);
      const payload = { business_id: businessId, category: form.category, limit_amount: parseFloat(form.limit_amount), period: form.period, start_date: form.start_date, end_date: endDate, spent: 0, notes };
      if (editing) {
        const { error } = await supabase.from('budgets').update(payload).eq('id', editing.id);
        if (error) throw error;
        addNotification('Budget diperbarui', 'success');
      } else {
        const { error } = await supabase.from('budgets').insert(payload);
        if (error) throw error;
        addNotification('Budget ditambahkan', 'success');
      }
      setIsModalOpen(false); setEditing(null); setForm(emptyForm);
      await fetchBudgets();
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus budget ini?')) return;
    await supabase.from('budgets').delete().eq('id', id);
    addNotification('Budget dihapus', 'info');
    await fetchBudgets();
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ category: b.category, limit_amount: b.limit_amount.toString(), period: b.period, start_date: b.start_date.split('T')[0], end_date: b.end_date.split('T')[0], notes: b.notes || '' });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Budgeting & Goal Tracking">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card"><p className="text-white/60 text-xs mb-1">Total Budget</p><p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p></div>
          <div className="card"><p className="text-white/60 text-xs mb-1">Total Terpakai</p><p className={`text-2xl font-bold ${totalSpent > totalLimit ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(totalSpent)}</p></div>
          <div className="card"><p className="text-white/60 text-xs mb-1">Melebihi Budget</p><p className="text-2xl font-bold text-red-400">{overBudget} kategori</p></div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Budget per Kategori</h2>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setIsModalOpen(true); }}>
            <FiPlus /> Tambah Budget
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /></div>
        ) : budgets.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-12">
              <FiTarget size={40} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/40">Belum ada budget. Klik "Tambah Budget" untuk mulai.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b, idx) => {
              const pct = Math.min((b.spent / b.limit_amount) * 100, 100);
              const over = b.spent > b.limit_amount;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card hover={false}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{b.category}</h3>
                          {over && <span className="flex items-center gap-1 text-xs text-red-400"><FiAlertTriangle size={11} /> Melebihi!</span>}
                        </div>
                        <p className="text-xs text-white/50 capitalize mt-0.5">{b.period === 'monthly' ? 'Bulanan' : b.period === 'quarterly' ? 'Kuartalan' : 'Tahunan'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-white/10 rounded-lg"><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg"><FiTrash2 size={13} className="text-red-400" /></button>
                      </div>
                    </div>
                    {b.notes && <p className="text-sm text-white/50 mb-3 whitespace-pre-wrap">{b.notes}</p>}
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Terpakai: <span className={over ? 'text-red-400 font-semibold' : 'text-white font-semibold'}>{formatCurrency(b.spent)}</span></span>
                      <span className="text-white/60">Batas: <span className="text-white font-semibold">{formatCurrency(b.limit_amount)}</span></span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-2.5 rounded-full ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                      />
                    </div>
                    <p className="text-right text-xs text-white/40 mt-1">{pct.toFixed(0)}% terpakai</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Budget' : 'Tambah Budget Baru'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Batas Budget (Rp)</label>
              <PriceInput required className="input-field" value={form.limit_amount} onChange={limit_amount => setForm({ ...form, limit_amount })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Periode</label>
              <select className="input-field" value={form.period} onChange={e => setForm({ ...form, period: e.target.value as any })}>
                <option value="monthly">Bulanan</option>
                <option value="quarterly">Kuartalan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mulai Tanggal</label>
            <input type="date" className="input-field" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi / Catatan</label>
            <textarea
              className="input-field"
              rows={2}
              required
              minLength={1}
              maxLength={100}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Tambahkan catatan (maksimal 100 karakter)"
            />
            <p className="text-xs text-white/40 mt-1">{form.notes.length}/100 karakter</p>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Budget'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
