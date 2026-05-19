'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  FiArrowRight, FiTrendingUp, FiCpu, FiShield,
  FiZap, FiBarChart2, FiUsers, FiStar
} from 'react-icons/fi';

const features = [
  {
    icon: <FiCpu size={26} />,
    color: 'from-violet-500/30 to-violet-500/0 text-violet-400 border-violet-500/20',
    title: 'Asisten Keuangan AI',
    description: 'Dapatkan rekomendasi cerdas dan wawasan tentang arus kas Anda secara instan.',
  },
  {
    icon: <FiBarChart2 size={26} />,
    color: 'from-pink-500/30 to-pink-500/0 text-pink-400 border-pink-500/20',
    title: 'Analitik Real-time',
    description: 'Dashboard interaktif dengan grafik premium dan prediksi berbasis data.',
  },
  {
    icon: <FiZap size={26} />,
    color: 'from-cyan-500/30 to-cyan-500/0 text-cyan-400 border-cyan-500/20',
    title: 'Scan Struk (OCR)',
    description: 'Ambil foto struk, AI langsung ekstrak dan catat transaksi otomatis.',
  },
  {
    icon: <FiShield size={26} />,
    color: 'from-green-500/30 to-green-500/0 text-green-400 border-green-500/20',
    title: 'Aman & Privat',
    description: 'Keamanan tingkat bank dengan enkripsi penuh dan Row-Level Security.',
  },
  {
    icon: <FiUsers size={26} />,
    color: 'from-amber-500/30 to-amber-500/0 text-amber-400 border-amber-500/20',
    title: 'CRM Pelanggan',
    description: 'Pantau pelanggan terbaik, riwayat pembelian, dan pola transaksi.',
  },
  {
    icon: <FiTrendingUp size={26} />,
    color: 'from-violet-500/30 to-violet-500/0 text-violet-400 border-violet-500/20',
    title: 'Integrasi Marketplace',
    description: 'Sinkronisasi otomatis dengan Tokopedia, Shopee, dan TikTok Shop.',
  },
];

const stats = [
  { value: '10K+', label: 'Pengguna Aktif' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Rp 50M+', label: 'Transaksi Tercatat' },
  { value: '4.9 ⭐', label: 'Rating Pengguna' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-darker overflow-x-hidden">

      {/* ── SPLINE ROBOT — FIXED FULL-SCREEN BACKGROUND ── */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        <iframe
          src="https://my.spline.design/nexbotrobotcharacterconcept-FNsuGhtZ8mqBi4nYmcAU0QP3/"
          frameBorder="0"
          width="100%"
          height="100%"
          title="DuitTrack AI Robot Background"
          className="w-full h-full"
        />
        {/* Dark overlay so text stays readable */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.45) 0%, rgba(9,9,11,0.3) 40%, rgba(9,9,11,0.7) 100%)' }}
        />
      </div>

      {/* ── ALL PAGE CONTENT sits on top of the robot ── */}
      <div className="relative z-10">

        {/* ── NAVBAR ── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="fixed top-0 w-full z-50 px-6 py-4"
          style={{ backdropFilter: 'blur(24px)', background: 'rgba(9,9,11,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight">
              <span className="gradient-text">Duit</span>
              <span className="text-white">Track</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors px-3 py-1.5">
                Masuk
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-xl bg-primary text-darker hover:brightness-110 transition-all shadow-lg shadow-primary/30">
                Daftar Gratis <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* ── HERO ── Full viewport, content centered ── */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/15 text-primary text-sm font-semibold backdrop-blur-md"
            >
              <FiStar size={12} />
              Platform Keuangan UMKM #1 Indonesia
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight drop-shadow-2xl"
            >
              <span className="gradient-text">Pembukuan Pintar</span>
              <br />
              <span className="text-white">untuk UMKM Indonesia</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
              className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-lg"
            >
              AI + Analitik + OCR dalam satu platform. Kelola keuangan bisnis Anda seperti CEO kelas dunia — tanpa kerumitan.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-darker font-bold rounded-2xl text-lg hover:brightness-110 transition-all shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95">
                Mulai Gratis Sekarang
                <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-2xl text-lg border border-white/20 text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-md">
                Login ke Akun
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-1.5 bg-white/50 rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── STATS STRIP ── */}
        <section
          className="border-y border-white/10 py-14 px-6"
          style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(20px)' }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
                <div className="text-sm text-white/50 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-28 px-6" style={{ background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Fitur Unggulan</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Semua yang kamu butuhkan,<br />
                <span className="gradient-text">dalam satu tempat</span>
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Dirancang khusus untuk pelaku UMKM Indonesia yang ingin tumbuh lebih cepat.</p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid md:grid-cols-3 gap-5"
            >
              {features.map((f, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative overflow-hidden rounded-2xl border p-6 cursor-default backdrop-blur-xl ${f.color.split(' ')[3] || 'border-white/10'}`}
                  style={{ background: 'rgba(15,15,20,0.6)' }}
                >
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${f.color.split(' ').slice(0, 2).join(' ')} opacity-40 rounded-bl-full pointer-events-none`} />
                  <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-white/5 ${f.color.split(' ')[2]}`}>
                    {f.icon}
                  </div>
                  <h3 className="relative z-10 text-lg font-bold mb-2 text-white">{f.title}</h3>
                  <p className="relative z-10 text-white/50 text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section className="py-28 px-6" style={{ background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl p-12 text-center border border-primary/20"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.12) 100%)', backdropFilter: 'blur(20px)' }}
          >
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Siap kelola bisnis<br /><span className="gradient-text">lebih cerdas?</span>
              </h2>
              <p className="text-white/60 text-lg mb-8">Gratis selamanya untuk fitur dasar. Upgrade kapan saja.</p>
              <Link href="/register" className="group inline-flex items-center gap-2 px-10 py-4 bg-primary text-darker font-black rounded-2xl text-lg hover:brightness-110 transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95">
                Mulai Gratis — Daftar Sekarang
                <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/10 py-10 px-6" style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xl font-black">
              <span className="gradient-text">Duit</span><span className="text-white">Track</span>
            </div>
            <p className="text-white/30 text-sm">© {new Date().getFullYear()} DuitTrack. Hak cipta dilindungi undang-undang.</p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/login" className="hover:text-white transition-colors">Masuk</Link>
              <Link href="/register" className="hover:text-white transition-colors">Daftar</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
