'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email atau kata sandi salah.'
        : err.message || 'Login gagal');
    } finally {
      setLoading(false);
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
            <p className="text-white/60">Masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-3 text-white/40" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field !pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white/80">Kata Sandi</label>
                <Link href="/forgot-password" className="text-xs text-accent hover:text-accent/80 transition-colors">
                  Lupa Kata Sandi?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-3 text-white/40" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field !pl-11"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={loading}>
                {loading ? 'Sedang masuk...' : 'Masuk'} <FiArrowRight />
              </Button>
            </div>
          </form>

          <p className="text-center text-white/60 text-sm mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-accent hover:text-accent/80 font-semibold">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
