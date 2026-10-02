'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset. Coba lagi.');
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
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Header */}
                <div className="text-center mb-8">
                  <Link href="/" className="inline-block text-3xl font-bold gradient-text mb-2">
                    DuitTrack
                  </Link>
                  <p className="text-white/60">Lupa Kata Sandi?</p>
                </div>

                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiMail size={26} className="text-primary" />
                </div>

                <p className="text-white/60 text-sm text-center mb-6">
                  Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset kata sandi Anda.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-3.5 text-white/40" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="email@kamu.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field !pl-11"
                      />
                    </div>
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
                      disabled={loading}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </Button>
                  </div>

                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors mt-2"
                  >
                    <FiArrowLeft size={14} /> Kembali ke Login
                  </Link>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <FiCheckCircle size={40} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Email Terkirim!</h2>
                <p className="text-white/60 text-sm mb-2">
                  Link reset kata sandi telah dikirim ke:
                </p>
                <p className="font-semibold text-primary mb-6">{email}</p>
                <p className="text-white/40 text-xs mb-8">
                  Tidak menerima email? Cek folder <span className="font-medium">Spam</span> atau tunggu beberapa menit.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-darker font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  <FiArrowLeft size={14} /> Kembali ke Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
