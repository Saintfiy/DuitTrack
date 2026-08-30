'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button } from '@/components/ui';
import {
  FiSave, FiUserCheck, FiLock, FiBell, FiGlobe,
  FiToggleLeft, FiToggleRight, FiShield, FiLogOut,
  FiCamera, FiUser,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const SettingsPage = () => {
  const { user, business, logout } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '' });
  const [businessData, setBusinessData] = useState({ name: '', industry: '', currency: 'IDR', country: 'ID', phone: '', address: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [notifStates, setNotifStates] = useState([true, true, false]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
      });
      setAvatarUrl((user as any).avatar_url || null);

      // Load notifikasi
      const prefs = (user as any).notification_preferences;
      if (prefs && Array.isArray(prefs)) {
        setNotifStates(prefs);
      }
    }
  }, [user]);

  useEffect(() => {
    if (business) {
      setBusinessData({
        name: business.name || '',
        industry: business.industry || 'retail',
        currency: business.currency || 'IDR',
        country: business.country || 'ID',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      addNotification('Hanya file gambar yang diperbolehkan', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      addNotification('Ukuran foto maksimal 3 MB', 'error');
      return;
    }

    // Tampilkan preview lokal dulu
    const reader = new FileReader();
    reader.onload = e => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Pakai timestamp agar selalu INSERT baru (hindari UPDATE policy)
      const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;

      // Upload ke Supabase Storage bucket "logos" (public)
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Simpan URL ke tabel users
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      addNotification('Foto profil berhasil diperbarui!', 'success');
    } catch (err: any) {
      setAvatarPreview(null);
      addNotification(err.message || 'Gagal mengupload foto', 'error');
    } finally {
      setUploadingAvatar(false);
      // Reset input agar file yang sama bisa dipilih ulang
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('users').update({
        full_name: profileData.full_name,
      }).eq('id', user.id);
      if (error) throw error;
      addNotification('Profil berhasil disimpan!', 'success');
    } catch (err: any) {
      addNotification(err.message || 'Gagal menyimpan profil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSavingBusiness(true);
    try {
      const { error } = await supabase.from('businesses').update({
        name: businessData.name,
        industry: businessData.industry,
        currency: businessData.currency,
        country: businessData.country,
        phone: businessData.phone || null,
        address: businessData.address || null,
      }).eq('id', business.id);
      if (error) throw error;

      // Update currency formatting globally
      localStorage.setItem('business_currency', businessData.currency);

      addNotification('Pengaturan bisnis disimpan!', 'success');

      // Reload page to apply currency formatting across all components
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      addNotification(err.message || 'Gagal menyimpan bisnis', 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      addNotification('Kata sandi baru tidak cocok', 'error');
      return;
    }
    if (passwords.newPass.length < 6) {
      addNotification('Kata sandi minimal 6 karakter', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      addNotification('Kata sandi berhasil diubah!', 'success');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      addNotification(err.message || 'Gagal mengubah kata sandi', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleNotif = async (idx: number) => {
    const newStates = notifStates.map((v, i) => i === idx ? !v : v);
    setNotifStates(newStates);

    // Simpan ke db
    if (user) {
      try {
        await supabase.from('users').update({
          notification_preferences: newStates
        }).eq('id', user.id);
      } catch (err) {
        console.error('Failed to save notification preferences', err);
      }
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = profileData.full_name
    ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <DashboardLayout title="Pengaturan">
      <div className="max-w-2xl space-y-6">

        {/* Profil */}
        <Card>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <FiUserCheck /> Pengaturan Profil
          </h3>

          {/* Avatar section */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 border-2 border-white/10 flex items-center justify-center">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>

              {/* Overlay hover */}
              <motion.button
                whileHover={{ opacity: 1 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCamera size={20} className="text-white" />
                )}
              </motion.button>
            </div>

            <div className="flex-1">
              <p className="font-semibold text-sm">{profileData.full_name || 'Pengguna'}</p>
              <p className="text-xs text-white/50 mt-0.5">{profileData.email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-2 text-xs text-primary hover:text-primary/80 transition-smooth flex items-center gap-1.5 disabled:opacity-50"
              >
                <FiCamera size={12} />
                {uploadingAvatar ? 'Mengupload...' : 'Ganti foto profil'}
              </button>
              <p className="text-xs text-white/30 mt-1">JPG, PNG, WEBP · Maks. 3 MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Nama Lengkap</label>
              <input type="text" className="input-field" value={profileData.full_name}
                onChange={e => setProfileData({ ...profileData, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <input type="email" className="input-field opacity-60 cursor-not-allowed" value={profileData.email} readOnly />
              <p className="text-xs text-white/40 mt-1">Email tidak dapat diubah langsung.</p>
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={savingProfile}>
              <FiSave /> {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </form>
        </Card>

        {/* Bisnis */}
        <Card>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiGlobe /> Pengaturan Bisnis
          </h3>
          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Nama Bisnis</label>
              <input type="text" className="input-field" value={businessData.name}
                onChange={e => setBusinessData({ ...businessData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Industri</label>
                <select className="input-field" value={businessData.industry}
                  onChange={e => setBusinessData({ ...businessData, industry: e.target.value })}>
                  <option value="retail">Retail</option>
                  <option value="food">Food & Beverage</option>
                  <option value="services">Jasa</option>
                  <option value="manufacturing">Manufaktur</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Mata Uang</label>
                <select className="input-field" value={businessData.currency}
                  onChange={e => setBusinessData({ ...businessData, currency: e.target.value })}>
                  <option value="IDR">IDR  Rupiah</option>
                  <option value="USD">USD  Dolar AS</option>
                  <option value="SGD">SGD  Dolar Singapura</option>
                  <option value="MYR">MYR  Ringgit</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Telepon Bisnis</label>
                <input type="tel" className="input-field" value={businessData.phone}
                  onChange={e => setBusinessData({ ...businessData, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Alamat</label>
                <input type="text" className="input-field" value={businessData.address}
                  onChange={e => setBusinessData({ ...businessData, address: e.target.value })} />
              </div>
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={savingBusiness}>
              <FiSave /> {savingBusiness ? 'Menyimpan...' : 'Simpan Bisnis'}
            </Button>
          </form>
        </Card>

        {/* Keamanan */}
        <Card>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiShield /> Keamanan
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Kata Sandi Baru</label>
              <input type="password" className="input-field" value={passwords.newPass}
                onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                placeholder="Min. 6 karakter" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Konfirmasi Kata Sandi</label>
              <input type="password" className="input-field" value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
              <FiLock /> {savingPassword ? 'Mengubah...' : 'Ubah Kata Sandi'}
            </Button>
          </form>
        </Card>

        {/* Notifikasi */}
        <Card>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiBell /> Preferensi Notifikasi
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Peringatan Stok Rendah', desc: 'Notifikasi saat item hampir habis' },
              { title: 'Pengingat Transaksi', desc: 'Ringkasan transaksi harian' },
              { title: 'Laporan Bulanan', desc: 'Laporan keuangan bulanan otomatis' },
            ].map((notif, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-white/10 rounded-xl">
                <div>
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm text-white/60">{notif.desc}</p>
                </div>
                <button onClick={() => toggleNotif(idx)}
                  className={`text-2xl transition-smooth ${notifStates[idx] ? 'text-accent' : 'text-white/30'}`}
                  type="button">
                  {notifStates[idx] ? <FiToggleRight /> : <FiToggleLeft />}
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Keluar */}
        <Card className="border border-red-500/20 bg-red-500/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
                <FiLogOut /> Keluar dari Akun
              </h3>
              <p className="text-sm text-white/60 mt-1">Sesi Anda akan diakhiri dan harus masuk kembali untuk mengakses DuitTrack.</p>
            </div>
            <Button variant="secondary" className="border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={logout}>
              Keluar Sekarang
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
