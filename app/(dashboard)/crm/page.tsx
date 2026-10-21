'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button, StatCard, Modal } from '@/components/ui';
import { FiPlus, FiSearch, FiPhone, FiMail, FiEdit2, FiTrash2, FiUser, FiUsers, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CRMPage() {
  const { businessId, business, loading: authLoading } = useAuth({ requireAuth: true });
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', email: '', phone: '', address: '' };
  const [formData, setFormData] = useState(emptyForm);

  const fetchCustomers = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('total_purchased', { ascending: false });
    if (!error) setCustomers(data || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { 
    if (authLoading) return;
    if (business?.workspace_type === 'personal') {
      router.replace('/dashboard');
      return;
    }
    if (!businessId) {
      setLoading(false);
      return;
    }
    fetchCustomers(); 
  }, [authLoading, business?.workspace_type, businessId, fetchCustomers, router]);

  if (business?.workspace_type === 'personal') return null;

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const totalRevenue = customers.reduce((s, c) => s + (c.total_purchased || 0), 0);
  const avgValue = customers.length > 0 ? totalRevenue / customers.length : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase.from('customers').update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
        }).eq('id', editingCustomer.id);
        if (error) throw error;
        addNotification('Data pelanggan diperbarui', 'success');
        setIsEditModalOpen(false);
      } else {
        const { error } = await supabase.from('customers').insert({
          business_id: businessId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          total_purchased: 0,
          total_transactions: 0,
        });
        if (error) throw error;
        addNotification('Pelanggan berhasil ditambahkan', 'success');
        setIsAddModalOpen(false);
      }
      setFormData(emptyForm);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      addNotification(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      addNotification('Pelanggan dihapus', 'info');
      await fetchCustomers();
    }
  };

  const openEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setIsEditModalOpen(true);
  };

  const customerFormJSX = (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nama Pelanggan / Perusahaan</label>
        <input required type="text" className="input-field" value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="input-field" value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
          <input type="tel" className="input-field" value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Alamat</label>
        <input type="text" className="input-field" value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })} />
      </div>
      <div className="pt-2 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Batal</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Menyimpan...' : editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout title="Manajemen Pelanggan">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Pelanggan" value={customers.length} icon={<FiUsers />} />
          <StatCard label="Total Pendapatan" value={formatCurrency(totalRevenue)} icon={<FiDollarSign />} />
          <StatCard label="Rata-rata Nilai" value={formatCurrency(avgValue)} icon={<FiBarChart2 />} />
        </div>

        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <FiSearch className="absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, email, telepon..."
              className="input-field pl-10"
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditingCustomer(null); setFormData(emptyForm); setIsAddModalOpen(true); }}>
            <FiPlus /> Tambah Pelanggan
          </Button>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-12">
              <p className="text-white/50">{search ? 'Tidak ada pelanggan yang cocok.' : 'Belum ada pelanggan. Tambah sekarang!'}</p>
            </div>
          </Card>
        ) : (
          <Card hover={false}>
            <div className="space-y-2">
              {filtered.map((customer, idx) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-smooth"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{customer.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-white/50 mt-0.5">
                          {customer.email && (
                            <span className="flex items-center gap-1 truncate"><FiMail size={12} /> {customer.email}</span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1"><FiPhone size={12} /> {customer.phone}</span>
                          )}
                        </div>
                        {customer.last_transaction_date && (
                          <p className="text-xs text-white/30 mt-0.5">
                            Terakhir transaksi: {formatDate(customer.last_transaction_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm">{formatCurrency(customer.total_purchased)}</p>
                      <p className="text-xs text-white/50">{customer.total_transactions} transaksi</p>
                      <div className="flex gap-1 justify-end mt-2">
                        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth" onClick={() => openEdit(customer)}>
                          <FiEdit2 size={13} />
                        </button>
                        <button className="p-1.5 hover:bg-red-500/20 rounded-lg transition-smooth" onClick={() => handleDelete(customer.id)}>
                          <FiTrash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Pelanggan">
        {customerFormJSX}
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pelanggan">
        {customerFormJSX}
      </Modal>
    </DashboardLayout>
  );
}
