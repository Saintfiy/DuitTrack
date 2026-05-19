'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiTrendingUp, FiCpu, FiShield,
  FiZap, FiBarChart2, FiUsers, FiX, FiCheck, FiSend, FiImage, FiLock, FiGlobe, FiPieChart
} from 'react-icons/fi';
import { PrismaHero } from '@/components/ui/prisma-hero';
import { FeatureShowcase } from '@/components/ui/feature-showcase';

// Premium Preview Components for Showcase
const AIAssistantPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
        <FiCpu size={20} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">AI Assistant</h3>
        <p className="text-xs text-slate-500">Online</p>
      </div>
    </div>
    <div className="flex-grow flex flex-col gap-3">
      <div className="self-end bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[80%] shadow-sm">
        Berapa total pengeluaran minggu ini?
      </div>
      <div className="self-start bg-slate-50 border border-slate-100 text-slate-700 text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[90%] shadow-sm leading-relaxed">
        Total pengeluaran minggu ini adalah <strong>Rp 4.250.000</strong>. Kategori terbesar adalah "Operasional" (Rp 2.100.000). <br/><br/>
        <span className="text-emerald-600 font-medium">↓ Turun 15% dari minggu lalu.</span>
      </div>
    </div>
    <div className="mt-auto pt-4 relative">
      <div className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center shadow-inner">
        <span className="text-slate-400 text-xs">Tanya sesuatu...</span>
      </div>
      <div className="absolute right-3 top-[1.35rem] w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm">
        <FiSend size={10} />
      </div>
    </div>
  </div>
);

const AnalyticsPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Cashflow Forecast</h3>
        <p className="text-xs text-slate-500">6 mo actual + 3 mo projected</p>
      </div>
      <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100">
        AI Predict
      </span>
    </div>
    <div className="flex-grow relative mt-2 border-b border-l border-slate-100">
      {/* Mock Chart Area */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Actual line */}
        <path d="M0,80 Q20,60 40,70 T60,40" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        <path d="M0,80 Q20,60 40,70 T60,40 L60,100 L0,100 Z" fill="url(#chartGrad)" />
        {/* Projected line (dashed) */}
        <path d="M60,40 Q80,20 100,30" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
        {/* Current marker */}
        <line x1="60" y1="0" x2="60" y2="100" stroke="#cbd5e1" strokeDasharray="2 2" />
        <circle cx="60" cy="40" r="3" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
      </svg>
    </div>
    <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-medium">
      <span>Jan</span><span>Mar</span><span className="text-indigo-500 font-bold">Now</span><span>Jul (est)</span>
    </div>
  </div>
);

const OCRPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-900">Smart OCR Scanner</h3>
      <p className="text-xs text-slate-500">Auto-extract receipt data</p>
    </div>
    <div className="flex-grow rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-3">
        <FiImage size={20} />
      </div>
      <p className="text-xs font-bold text-slate-700">Drop receipt here</p>
      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
    </div>
    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-500">
        <FiZap size={14} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-700">Processing...</p>
        <div className="w-24 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
          <div className="w-1/2 h-full bg-amber-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const SecurityPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
     <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <FiShield size={20} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Bank-Grade Security</h3>
        <p className="text-xs text-slate-500">End-to-end encrypted</p>
      </div>
    </div>
    <div className="space-y-4 flex-grow flex flex-col justify-center">
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <FiLock className="text-slate-400" size={14} />
          <span className="text-xs font-medium text-slate-700">Row-Level Security</span>
        </div>
        <FiCheck className="text-emerald-500" size={14} />
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Supabase Auth Active</span>
        </div>
      </div>
    </div>
  </div>
);

const CRMPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-900">Recent Customers</h3>
      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
        <FiUsers size={14} />
      </div>
    </div>
    <div className="space-y-3">
      {[
        { name: "Budi Santoso", amount: "Rp 1.2M", time: "2h ago", avatar: "BS", color: "bg-rose-100 text-rose-700" },
        { name: "Siti Aminah", amount: "Rp 450K", time: "5h ago", avatar: "SA", color: "bg-indigo-100 text-indigo-700" },
        { name: "CV Makmur", amount: "Rp 3.5M", time: "1d ago", avatar: "CM", color: "bg-emerald-100 text-emerald-700" }
      ].map((user, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${user.color}`}>
            {user.avatar}
          </div>
          <div className="flex-grow">
            <p className="text-xs font-bold text-slate-700">{user.name}</p>
            <p className="text-[10px] text-slate-400">{user.time}</p>
          </div>
          <p className="text-xs font-bold text-slate-900">{user.amount}</p>
        </div>
      ))}
    </div>
  </div>
);

const IntegrationsPreview = () => (
  <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden">
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-900">Omnichannel Sync</h3>
      <p className="text-xs text-slate-500">Connect your sales platforms</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[
        { name: "Shopee", icon: <FiGlobe />, bg: "bg-orange-50 text-orange-600 border-orange-100" },
        { name: "Tokopedia", icon: <FiPieChart />, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { name: "QRIS", icon: <FiZap />, bg: "bg-red-50 text-red-600 border-red-100" },
        { name: "GoPay", icon: <FiTrendingUp />, bg: "bg-sky-50 text-sky-600 border-sky-100" },
      ].map((app, i) => (
        <div key={i} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 ${app.bg}`}>
          {app.icon}
          <span className="text-[10px] font-bold">{app.name}</span>
        </div>
      ))}
    </div>
  </div>
);

const features = [
  {
    icon: <FiCpu />,
    color: 'text-indigo-600',
    baseColor: 'bg-indigo-600',
    accentBg: 'bg-indigo-50',
    title: 'Asisten Keuangan AI',
    description: 'Rekomendasi cerdas dan wawasan instan layaknya konsultan keuangan kelas dunia.',
    preview: <AIAssistantPreview />
  },
  {
    icon: <FiBarChart2 />,
    color: 'text-rose-500',
    baseColor: 'bg-rose-500',
    accentBg: 'bg-rose-50',
    title: 'Analitik Real-time',
    description: 'Dashboard interaktif dengan grafik premium dan prediksi cashflow berbasis AI.',
    preview: <AnalyticsPreview />
  },
  {
    icon: <FiImage />,
    color: 'text-amber-500',
    baseColor: 'bg-amber-500',
    accentBg: 'bg-amber-50',
    title: 'Smart OCR Scanner',
    description: 'Foto struk, lalu AI akan otomatis mengekstrak data dan mencatat transaksi.',
    preview: <OCRPreview />
  },
  {
    icon: <FiShield />,
    color: 'text-emerald-500',
    baseColor: 'bg-emerald-500',
    accentBg: 'bg-emerald-50',
    title: 'Bank-Grade Security',
    description: 'Enkripsi penuh & Row-Level Security. Privasi data bisnis Anda terjamin 100%.',
    preview: <SecurityPreview />
  },
  {
    icon: <FiUsers />,
    color: 'text-sky-500',
    baseColor: 'bg-sky-500',
    accentBg: 'bg-sky-50',
    title: 'CRM Terintegrasi',
    description: 'Pantau pelanggan setia, riwayat pembelian, dan pola transaksi mereka.',
    preview: <CRMPreview />
  },
  {
    icon: <FiGlobe />,
    color: 'text-violet-500',
    baseColor: 'bg-violet-500',
    accentBg: 'bg-violet-50',
    title: 'Sinkronisasi Otomatis',
    description: 'Integrasi lancar dengan berbagai marketplace & dompet digital di Indonesia.',
    preview: <IntegrationsPreview />
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center justify-between w-full max-w-5xl px-6 py-3.5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-slate-900">
              Duit<span className="text-slate-400 font-medium">Track</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#fitur" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Fitur</Link>
            <Link href="#keunggulan" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Keunggulan</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-slate-900 px-3">Masuk</Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-xs">Coba Gratis</Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <PrismaHero />

      {/* ── FEATURES SHOWCASE ── */}
      <section id="fitur" className="py-24 px-6 relative bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-indigo-600 font-bold text-sm tracking-widest uppercase mb-3">Fitur Canggih</h2>
            <h3 className="font-display font-black text-3xl md:text-5xl text-slate-900 mb-4 tracking-tight">
              Platform All-in-One <br/>untuk Bisnis Modern
            </h3>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Singkirkan spreadsheet manual. DuitTrack mengotomatisasi segalanya dengan AI, memberi Anda kontrol penuh atas keuangan.
            </p>
          </div>
          <FeatureShowcase features={features} />
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="keunggulan" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        {/* Decorative BG element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h3 className="font-display font-black text-3xl md:text-4xl text-slate-900 mb-4 tracking-tight">
              Waktunya Beralih ke DuitTrack
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              <div className="flex items-center gap-2 text-rose-500 font-bold mb-6 text-sm uppercase tracking-wider">
                <FiX size={18} /> Cara Lama
              </div>
              <ul className="space-y-4">
                {[
                  'Catat manual di buku / Excel tiap malam',
                  'Laporan mingguan memakan waktu berjam-jam',
                  'Struk belanja sering hilang atau rusak',
                  'Sulit melacak piutang pelanggan',
                  'Tidak ada prediksi arus kas masa depan'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <FiX className="text-rose-400 mt-0.5 flex-shrink-0" /> {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* DuitTrack Way */}
            <div className="bg-indigo-600 rounded-3xl p-8 shadow-indigo relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 text-indigo-100 font-bold mb-6 text-sm uppercase tracking-wider">
                <FiCheck size={18} /> Dengan DuitTrack
              </div>
              <ul className="space-y-4 relative z-10">
                {[
                  'Scan struk, biarkan AI yang mencatat otomatis',
                  'Dashboard & grafik real-time 24/7',
                  'Semua nota tersimpan aman di Cloud',
                  'CRM terintegrasi pantau riwayat pelanggan',
                  'AI Prediksi arus kas & beri peringatan dini'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-indigo-50 text-sm">
                    <FiCheck className="text-indigo-300 mt-0.5 flex-shrink-0" /> {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-white border-t border-slate-100 text-center">
        <h2 className="font-display font-black text-3xl md:text-5xl text-slate-900 mb-6 tracking-tight">
          Siap Meningkatkan Skala Bisnis Anda?
        </h2>
        <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">
          Bergabung dengan ribuan UMKM yang telah menghemat waktu berjam-jam setiap minggunya.
        </p>
        <Link href="/register" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
          Mulai Uji Coba Gratis <FiArrowRight />
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900">DuitTrack</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} DuitTrack. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
