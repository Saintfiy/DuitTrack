'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase kirim token via URL fragment — tunggu session terbentuk
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const strength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kata sandi. Coba minta link baru.');
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
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <FiCheckCircle size={40} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Kata Sandi Diperbarui!</h2>
              <p className="text-white/60 text-sm mb-6">
                Kata sandi baru Anda berhasil disimpan. Anda akan diarahkan ke halaman login...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-darker font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Login Sekarang <FiArrowRight size={14} />
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <Link href="/" className="inline-block text-3xl font-bold gradient-text mb-2">
                  DuitTrack
                </Link>
                <p className="text-white/60">Buat Kata Sandi Baru</p>
              </div>

              <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiLock size={26} className="text-primary" />
              </div>

              {!sessionReady && (
                <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs text-center">
                  ⏳ Memverifikasi link reset... pastikan Anda membuka halaman ini dari link di email.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password baru */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-3.5 text-white/40" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field !pl-11 !pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength ? strengthColor : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'][strength]}`}>
                        Kekuatan: {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Konfirmasi */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-3.5 text-white/40" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-field !pl-11 !pr-11 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-500/50'
                          : confirmPassword && confirmPassword === password
                          ? 'border-green-500/50'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-3.5 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <FiCheckCircle size={12} /> Kata sandi cocok
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
                  >
                    <FiAlertCircle className="shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    disabled={loading || !sessionReady}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'} {!loading && <FiArrowRight />}
                  </Button>
                </div>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                  Kembali ke Login
                </Link>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
