'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'business' | 'complete'>('account');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    workspaceType: 'business' as 'business' | 'personal',
    industry: 'retail',
    country: 'ID',
    currency: 'IDR',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'account') {
      if (!formData.fullName || !formData.email || formData.password.length < 6) {
        setError('Silakan isi semua field. Kata sandi minimal 6 karakter.');
        return;
      }
      setStep('business');
      return;
    }

    if (step === 'business') {
      if (formData.workspaceType === 'business' && !formData.businessName.trim()) {
        setError('Silakan masukkan nama bisnis');
        return;
      }
      setLoading(true);
      try {
        // 1. Register user dengan Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.fullName, workspace_type: formData.workspaceType } },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Gagal membuat akun');

        const userId = authData.user.id;

        // 2. Buat record user di tabel users
        const { error: userErr } = await supabase.from('users').insert({
          id: userId,
          email: formData.email,
          full_name: formData.fullName,
          role: 'owner',
        });
        if (userErr && userErr.code !== '23505') throw userErr; // ignore duplicate

        // 3. Buat bisnis
        const { data: bizData, error: bizErr } = await supabase
          .from('businesses')
          .insert({
            owner_id: userId,
            name: formData.workspaceType === 'personal'
              ? `Keuangan Pribadi - ${formData.fullName.trim()}`
              : formData.businessName.trim(),
            workspace_type: formData.workspaceType,
            industry: formData.industry,
            country: formData.country,
            currency: formData.currency,
            business_health_score: 100,
          })
          .select()
          .single();
        if (bizErr) throw bizErr;

        // 4. Update user dengan business_id
        await supabase
          .from('users')
          .update({ business_id: bizData.id })
          .eq('id', userId);

        // Langsung redirect ke dashboard (tanpa email verification)
        router.push('/dashboard');
      } catch (err: any) {
        let msg = err.message || 'Pendaftaran gagal';
        if (msg.includes('rate limit') || msg.includes('Rate limit') || msg.includes('over_email_send_rate_limit')) {
          msg = 'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi, atau nonaktifkan "Confirm email" di Supabase Dashboard (Authentication → Settings).';
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-darker flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-3xl font-bold gradient-text mb-2">
              DuitTrack
            </Link>
            <p className="text-white/60">Buat akun gratis Anda</p>
          </div>

          {step === 'complete' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <FiCheck className="text-3xl text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Akun Berhasil Dibuat!</h2>
              <p className="text-white/60 mb-6">Silakan masuk dengan akun yang baru Anda buat.</p>
              <Button variant="primary" size="lg" className="w-full justify-center" onClick={() => router.push('/login')}>
                Masuk Sekarang <FiArrowRight />
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleNext} className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {(['account', 'business'] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-smooth ${
                      step === s ? 'bg-primary text-darker' : i < ['account','business'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'
                    }`}>{i + 1}</div>
                    {i < 1 && <div className="flex-1 h-px bg-white/20 w-8" />}
                  </div>
                ))}
                <span className="text-xs text-white/50 ml-1">{step === 'account' ? 'Informasi Akun' : 'Jenis Pencatatan'}</span>
              </div>

              {step === 'account' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Nama Lengkap</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-3 text-white/40" />
                      <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="input-field !pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-3 text-white/40" />
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input-field !pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Kata Sandi</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-3 text-white/40" />
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} className="input-field !pl-11" />
                    </div>
                    <p className="text-xs text-white/50 mt-1">Minimal 6 karakter</p>
                  </div>
                </>
              )}

              {step === 'business' && (
                <>
                  <fieldset>
                    <legend className="block text-sm font-medium text-white/80 mb-2">Pilih jenis pencatatan</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'business', title: 'Bisnis', description: 'Untuk usaha dan operasional' },
                        { value: 'personal', title: 'Pribadi', description: 'Untuk keuangan sehari-hari' },
                      ] as const).map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, workspaceType: option.value })}
                          aria-pressed={formData.workspaceType === option.value}
                          className={`rounded-xl border p-3 text-left transition-smooth ${
                            formData.workspaceType === option.value
                              ? 'border-primary bg-primary/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="block font-semibold">{option.title}</span>
                          <span className="mt-1 block text-xs text-white/50">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {formData.workspaceType === 'business' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Nama Bisnis</label>
                        <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Industri</label>
                        <select name="industry" value={formData.industry} onChange={handleChange} className="input-field">
                          <option value="retail">Retail</option>
                          <option value="food">Food & Beverage</option>
                          <option value="services">Jasa</option>
                          <option value="manufacturing">Manufaktur</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl bg-white/5 p-4 text-sm text-white/60">
                      Mode pribadi berisi transaksi, hutang/piutang, budgeting, cashflow, laporan, scan struk, dan asisten AI. Menu inventori dan pelanggan tidak ditampilkan.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Negara</label>
                      <select name="country" value={formData.country} onChange={handleChange} className="input-field">
                        <option value="ID">Indonesia</option>
                        <option value="SG">Singapore</option>
                        <option value="MY">Malaysia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Mata Uang</label>
                      <select name="currency" value={formData.currency} onChange={handleChange} className="input-field">
                        <option value="IDR">IDR</option>
                        <option value="SGD">SGD</option>
                        <option value="MYR">MYR</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">{error}</div>
              )}

              <div className="pt-2 flex gap-3">
                {step === 'business' && (
                  <Button variant="secondary" size="lg" className="justify-center" type="button" onClick={() => setStep('account')}>
                    Kembali
                  </Button>
                )}
                <Button type="submit" variant="primary" size="lg" className="flex-1 justify-center" disabled={loading}>
                  {loading ? 'Membuat akun...' : step === 'business' ? 'Buat Akun' : 'Lanjutkan'} <FiArrowRight />
                </Button>
              </div>
            </form>
          )}

          {step !== 'complete' && (
            <p className="text-center text-white/60 text-sm mt-6">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-accent hover:text-accent/80 font-semibold">Masuk</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
