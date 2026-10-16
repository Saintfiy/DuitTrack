'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button, StatCard, Modal, PriceInput } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle, FiClock, FiDollarSign, FiArrowDownCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Menunggu', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: FiClock },
  overdue: { label: 'Jatuh Tempo', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: FiAlertTriangle },
  paid: { label: 'Lunas', color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: FiCheckCircle },
  partial: { label: 'Sebagian', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: FiClock },
};

const emptyForm = { type: 'receivable' as 'receivable' | 'payable', customer_name: '', amount: '', due_date: '', notes: '', status: 'pending' };

export default function HutangPiutangPage() {
  const { businessId, loading: authLoading } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'receivable' | 'payable'>('receivable');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchDebts = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data } = await supabase.from('debts').select('*').eq('business_id', businessId).order('due_date', { ascending: true });
    const now = new Date();
    const updated = (data || []).map(d => ({
      ...d,
      status: d.status === 'pending' && new Date(d.due_date) < now ? 'overdue' : d.status,
    }));
    setDebts(updated);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId) { setLoading(false); return; }
    fetchDebts();
  }, [authLoading, businessId, fetchDebts]);

  const filtered = debts.filter(d => d.type === tab);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
  const totalPayable = debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
  const overdue = debts.filter(d => d.status === 'overdue').length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    try {
      const payload = { business_id: businessId, type: form.type, customer_name: form.customer_name, amount: parseFloat(form.amount), due_date: form.due_date, notes: form.notes || null, status: form.status };
      if (editing) {
        const { error } = await supabase.from('debts').update(payload).eq('id', editing.id);
        if (error) throw error;
        addNotification('Data diperbarui', 'success');
      } else {
        const { error } = await supabase.from('debts').insert(payload);
        if (error) throw error;
        addNotification('Berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false); setEditing(null); setForm(emptyForm);
      await fetchDebts();
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async (id: string) => {
    await supabase.from('debts').update({ status: 'paid' }).eq('id', id);
    addNotification('Ditandai Lunas ✓', 'success');
    await fetchDebts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus?')) return;
    await supabase.from('debts').delete().eq('id', id);
    addNotification('Dihapus', 'info');
    await fetchDebts();
  };

  const openEdit = (debt: any) => {
    setEditing(debt);
    setForm({ type: debt.type, customer_name: debt.customer_name, amount: debt.amount.toString(), due_date: debt.due_date.split('T')[0], notes: debt.notes || '', status: debt.status });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Hutang & Piutang">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Piutang" value={formatCurrency(totalReceivable)} icon={<FiDollarSign />} />
          <StatCard label="Total Hutang" value={formatCurrency(totalPayable)} icon={<FiArrowDownCircle />} />
          <StatCard label="Jatuh Tempo" value={`${overdue} item`} icon={<FiAlertTriangle />} />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['receivable', 'payable'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${tab === t ? 'bg-primary text-darker' : 'text-white/60 hover:text-white'}`}>
                {t === 'receivable' ? 'Piutang (Tagihan)' : 'Hutang (Kewajiban)'}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setForm({ ...emptyForm, type: tab }); setIsModalOpen(true); }}>
            <FiPlus /> Tambah
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card hover={false}><p className="text-center text-white/40 py-10">Belum ada data.</p></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((debt, idx) => {
              const cfg = statusConfig[debt.status] || statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <motion.div key={debt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card hover={false}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold">{debt.customer_name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">Jatuh tempo: {formatDate(debt.due_date)}</p>
                        {debt.notes && <p className="text-xs text-white/40 mt-1 truncate">{debt.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${debt.type === 'receivable' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(debt.amount)}</p>
                        <div className="flex gap-1 justify-end mt-2">
                          {debt.status !== 'paid' && (
                            <button onClick={() => handleMarkPaid(debt.id)} title="Tandai Lunas" className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-smooth">
                              <FiCheckCircle size={13} />
                            </button>
                          )}
                          <button onClick={() => openEdit(debt)} className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth"><FiEdit2 size={13} /></button>
                          <button onClick={() => handleDelete(debt.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-smooth"><FiTrash2 size={13} className="text-red-400" /></button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Data' : 'Tambah Baru'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jenis</label>
            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
              <option value="receivable">Piutang (uang yang akan diterima)</option>
              <option value="payable">Hutang (uang yang harus dibayar)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama {form.type === 'receivable' ? 'Debitur' : 'Kreditur'}</label>
            <input required type="text" className="input-field" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
              <PriceInput required className="input-field" value={form.amount} onChange={amount => setForm({ ...form, amount })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jatuh Tempo</label>
              <input required type="date" className="input-field" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Menunggu</option>
              <option value="partial">Sebagian Terbayar</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
