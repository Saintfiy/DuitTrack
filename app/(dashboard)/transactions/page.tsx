'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button, Modal, PriceInput } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiDownload, FiLoader, FiImage } from 'react-icons/fi';
import { formatCurrency, formatDate, exportToCSV } from '@/utils/helpers';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const BUSINESS_CATEGORIES_INCOME = ['Penjualan Produk', 'Jasa', 'Investasi', 'Lainnya'];
const BUSINESS_CATEGORIES_EXPENSE = ['Operasional', 'Perlengkapan', 'Gaji', 'Sewa', 'Marketing', 'Lainnya'];
const PERSONAL_CATEGORIES_INCOME = ['Gaji', 'Usaha Sampingan', 'Investasi', 'Hadiah', 'Lainnya'];
const PERSONAL_CATEGORIES_EXPENSE = ['Makanan & Minuman', 'Tagihan', 'Transportasi', 'Belanja', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Lainnya'];

export default function TransactionsPage() {
  const { user, businessId, workspaceType, loading: authLoading } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const isPersonal = workspaceType === 'personal';
  const categoriesIncome = isPersonal ? PERSONAL_CATEGORIES_INCOME : BUSINESS_CATEGORIES_INCOME;
  const categoriesExpense = isPersonal ? PERSONAL_CATEGORIES_EXPENSE : BUSINESS_CATEGORIES_EXPENSE;

  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    description: '', amount: '', type: 'income',
    category: isPersonal ? 'Gaji' : 'Penjualan Produk', paymentMethod: 'Tunai',
    date: new Date().toISOString().split('T')[0],
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    setFormData(current => ({
      ...current,
      category: current.type === 'income' ? categoriesIncome[0] : categoriesExpense[0],
    }));
  }, [workspaceType]);

  const fetchTransactions = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });
    if (!error) setTransactions(data || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { 
    if (authLoading) return;
    if (!businessId) {
      setLoading(false);
      return;
    }
    fetchTransactions(); 
  }, [authLoading, businessId, fetchTransactions]);

  const filtered = transactions.filter(
    (tx) => selectedType === 'all' || tx.type === selectedType
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !user) return;
    setSaving(true);
    try {
      if (editingTx) {
        const { error } = await supabase.from('transactions').update({
          description: formData.description,
          amount: Number(formData.amount),
          type: formData.type,
          category: formData.category,
          payment_method: formData.paymentMethod,
          date: new Date(formData.date).toISOString(),
        }).eq('id', editingTx.id);
        if (error) throw error;
        addNotification('Transaksi diperbarui', 'success');
        setIsEditModalOpen(false);
      } else {
        const { error } = await supabase.from('transactions').insert({
          business_id: businessId,
          description: formData.description,
          amount: Number(formData.amount),
          type: formData.type,
          category: formData.category,
          payment_method: formData.paymentMethod,
          date: new Date(formData.date).toISOString(),
          created_by: user.id,
          synced_with_payment: false,
        });
        if (error) throw error;
        addNotification('Transaksi berhasil ditambahkan', 'success');
        setIsAddModalOpen(false);
      }
      setFormData(emptyForm);
      await fetchTransactions();
    } catch (err: any) {
      addNotification(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      addNotification('Transaksi dihapus', 'info');
      await fetchTransactions();
    }
  };

  const openEdit = (tx: any) => {
    setEditingTx(tx);
    setFormData({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category,
      paymentMethod: tx.payment_method,
      date: tx.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const filterLabels: Record<string, string> = { all: 'Semua', income: 'Pemasukan', expense: 'Pengeluaran' };
  const categories = formData.type === 'income' ? categoriesIncome : categoriesExpense;

  const transactionFormJSX = (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <input required type="text" className="input-field" value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipe</label>
          <select className="input-field" value={formData.type}
            onChange={e => setFormData({
              ...formData,
              type: e.target.value,
              category: e.target.value === 'income' ? categoriesIncome[0] : categoriesExpense[0],
            })}>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
          <PriceInput required min={1} className="input-field" value={formData.amount}
            onChange={amount => setFormData({ ...formData, amount })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select className="input-field" value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Metode Bayar</label>
          <select className="input-field" value={formData.paymentMethod}
            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
            {['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Kredit', 'E-Wallet'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tanggal</label>
        <input type="date" className="input-field" value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })} />
      </div>
      <div className="pt-2 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Batal</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Menyimpan...' : editingTx ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout title="Transaksi">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <p className="text-white/60 text-sm">
            Total: <span className="font-semibold text-white">{filtered.length} transaksi</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              const csvData = filtered.map(t => ({
                Tanggal: formatDate(t.date), Deskripsi: t.description,
                Kategori: t.category, Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                Jumlah: t.amount, Metode: t.payment_method,
              }));
              exportToCSV(csvData, 'transaksi');
            }}>
              <FiDownload size={14} /> Ekspor CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditingTx(null); setFormData(emptyForm); setIsAddModalOpen(true); }}>
              <FiPlus size={14} /> Tambah
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button key={type} onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg transition-smooth text-sm font-medium ${
                selectedType === type ? 'bg-primary text-darker shadow-md' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}>
              {filterLabels[type]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-12">
              <p className="text-white/50">Belum ada transaksi. Klik &quot;Tambah&quot; untuk mulai.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card hover={false} className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm">Deskripsi</th>
                      <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm">Kategori</th>
                      <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm">Pembayaran</th>
                      <th className="text-right py-3 px-4 font-semibold text-white/70 text-sm">Jumlah</th>
                      <th className="text-right py-3 px-4 font-semibold text-white/70 text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx, idx) => (
                      <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-smooth">
                        <td className="py-3 px-4 text-sm text-white/70">{formatDate(tx.date)}</td>
                        <td className="py-3 px-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {tx.description}
                            {tx.receipt_url && (
                              <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-smooth" title="Lihat Struk">
                                <FiImage size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tx.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{tx.category}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-white/60">{tx.payment_method}</td>
                        <td className={`py-3 px-4 text-right font-semibold text-sm ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth" onClick={() => openEdit(tx)}>
                              <FiEdit2 size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-red-500/20 rounded-lg transition-smooth" onClick={() => handleDelete(tx.id)}>
                              <FiTrash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {filtered.map((tx, idx) => (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{tx.description}</p>
                        {tx.receipt_url && (
                          <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-smooth" title="Lihat Struk">
                            <FiImage size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{formatDate(tx.date)} · {tx.payment_method}</p>
                    </div>
                    <p className={`font-bold text-sm ml-3 flex-shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {tx.category}
                    </span>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth" onClick={() => openEdit(tx)}><FiEdit2 size={13} /></button>
                      <button className="p-1.5 hover:bg-red-500/20 rounded-lg transition-smooth" onClick={() => handleDelete(tx.id)}><FiTrash2 size={13} className="text-red-400" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Transaksi">
        {transactionFormJSX}
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Transaksi">
        {transactionFormJSX}
      </Modal>
    </DashboardLayout>
  );
}
