'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button, StatCard, Modal, PriceInput } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiBell, FiDownload, FiBox, FiDollarSign } from 'react-icons/fi';
import { formatCurrency, exportToCSV } from '@/utils/helpers';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const { businessId, business, loading: authLoading } = useAuth({ requireAuth: true });
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', sku: '', quantity: '', unitPrice: '', reorderLevel: '', supplier: '' };
  const [formData, setFormData] = useState(emptyForm);

  const fetchInventory = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('business_id', businessId)
      .order('name');
    if (!error) setInventory(data || []);
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
    fetchInventory(); 
  }, [authLoading, business?.workspace_type, businessId, fetchInventory, router]);

  if (business?.workspace_type === 'personal') return null;

  const lowStockItems = inventory.filter(i => i.quantity <= i.reorder_level);
  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    try {
      const payload = {
        business_id: businessId,
        name: formData.name,
        sku: formData.sku,
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unitPrice),
        reorder_level: Number(formData.reorderLevel),
        supplier: formData.supplier || null,
      };

      if (editingItem) {
        const { error } = await supabase.from('inventory').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        addNotification('Item berhasil diperbarui', 'success');
        setIsEditModalOpen(false);
      } else {
        const { error } = await supabase.from('inventory').insert(payload);
        if (error) throw error;
        addNotification('Item berhasil ditambahkan', 'success');
        setIsAddModalOpen(false);
      }

      setFormData(emptyForm);
      setEditingItem(null);
      await fetchInventory();
    } catch (err: any) {
      addNotification(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item ini dari inventori?')) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (!error) {
      addNotification('Item dihapus', 'info');
      await fetchInventory();
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      quantity: String(item.quantity),
      unitPrice: String(item.unit_price),
      reorderLevel: String(item.reorder_level),
      supplier: item.supplier || '',
    });
    setIsEditModalOpen(true);
  };

  const itemFormJSX = (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nama Item</label>
        <input required type="text" className="input-field" value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input required type="text" className="input-field" value={formData.sku}
            onChange={e => setFormData({ ...formData, sku: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supplier</label>
          <input type="text" className="input-field" value={formData.supplier}
            onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Harga Satuan</label>
          <PriceInput required className="input-field" value={formData.unitPrice}
            onChange={unitPrice => setFormData({ ...formData, unitPrice })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jumlah</label>
          <input required type="number" min="0" className="input-field" value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Batas Min.</label>
          <input required type="number" min="0" className="input-field" value={formData.reorderLevel}
            onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} />
        </div>
      </div>
      <div className="pt-2 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Batal</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Item'}
        </Button>
      </div>
    </form>
  );

  return (
    <DashboardLayout title="Manajemen Inventori">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Item" value={inventory.length} icon={<FiBox />} />
          <StatCard label="Item Stok Rendah" value={lowStockItems.length} icon={<FiAlertTriangle />} />
          <StatCard label="Nilai Inventori" value={formatCurrency(totalValue)} icon={<FiDollarSign />} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Item Stok</h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              const csvData = inventory.map(i => ({
                SKU: i.sku, Nama: i.name, Jumlah: i.quantity,
                'Harga Satuan': i.unit_price, 'Total Nilai': i.quantity * i.unit_price,
                Supplier: i.supplier || '-',
              }));
              exportToCSV(csvData, 'inventori');
            }}>
              <FiDownload size={14} /> Ekspor
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setFormData(emptyForm); setIsAddModalOpen(true); }}>
              <FiPlus /> Tambah Item
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
            <FiAlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-200">{lowStockItems.length} item memiliki stok rendah</p>
              <p className="text-sm text-yellow-200/60 mt-0.5">
                {lowStockItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </motion.div>
        )}

        {/* Inventory Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : inventory.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-12">
              <p className="text-white/50">Belum ada item inventori. Klik &quot;Tambah Item&quot; untuk mulai.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-white/80">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/80">Supplier</th>
                    <th className="text-right py-3 px-4 font-semibold text-white/80">Jumlah</th>
                    <th className="text-right py-3 px-4 font-semibold text-white/80">Harga Satuan</th>
                    <th className="text-right py-3 px-4 font-semibold text-white/80">Total Nilai</th>
                    <th className="text-center py-3 px-4 font-semibold text-white/80">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-white/80">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-mono text-white/70">{item.sku}</td>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-white/60">{item.supplier || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={item.quantity <= item.reorder_level ? 'text-yellow-400 font-semibold' : ''}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.quantity * item.unit_price)}</td>
                      <td className="py-3 px-4 text-center">
                        {item.quantity <= item.reorder_level
                          ? <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1 justify-center"><FiBell size={11} />Rendah</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Normal</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-1 hover:bg-white/10 rounded" onClick={() => openEdit(item)}><FiEdit2 size={15} /></button>
                          <button className="p-1 hover:bg-red-500/20 rounded" onClick={() => handleDelete(item.id)}><FiTrash2 size={15} className="text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Item Inventori">
        {itemFormJSX}
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Item">
        {itemFormJSX}
      </Modal>
    </DashboardLayout>
  );
}
