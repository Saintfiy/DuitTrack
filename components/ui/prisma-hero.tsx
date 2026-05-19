"use client";

import { motion, useInView } from "framer-motion";
import { FiArrowRight, FiTrendingUp, FiUsers, FiZap } from "react-icons/fi";
import { useRef } from "react";
import Link from "next/link";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- Mini Stat Card ---------------- */
const MiniStat = ({ value, label, delay }: { value: string; label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col"
  >
    <span className="text-2xl font-bold text-indigo-600 font-display">{value}</span>
    <span className="text-xs text-slate-500 font-medium mt-0.5">{label}</span>
  </motion.div>
);

/* ---------------- Floating Badge ---------------- */
const FloatingBadge = ({
  icon,
  label,
  sub,
  color,
  className,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  className: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className={`absolute ${className} bg-white rounded-2xl shadow-elevated border border-slate-100/80 px-4 py-3 flex items-center gap-3 z-20 backdrop-blur-sm`}
  >
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-900 font-bold text-sm leading-none">{label}</p>
      <p className="text-slate-400 text-[11px] mt-1">{sub}</p>
    </div>
  </motion.div>
);

/* ---------------- PrismaHero ---------------- */
export const PrismaHero = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden hero-gradient flex items-center">
      {/* Decorative orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-amber-400/5 blur-[80px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* ── LEFT: Copy ── */}
          <div className="flex flex-col gap-8">
            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Platform Keuangan UMKM #1 Indonesia
            </motion.div>

            {/* Headline */}
            <div>
              <h1
                className="font-display font-black tracking-tight leading-[1.08]"
                style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)", color: "#0f172a" }}
              >
                <WordsPullUp text="Kelola Keuangan" />
                <br />
                <span className="gradient-text">
                  <WordsPullUp text="Bisnis Anda," />
                </span>
                <br />
                <WordsPullUp text="Cerdas & Otomatis" style={{ color: "#0f172a" }} />
              </h1>
            </div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-slate-500 text-lg leading-relaxed max-w-lg"
            >
              AI + Analitik + OCR dalam satu platform. Dari pencatatan transaksi hingga laporan laba rugi — semua otomatis dan real-time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold
                           hover:bg-indigo-500 active:scale-95 transition-all duration-200
                           shadow-lg shadow-indigo-500/30"
              >
                Mulai Gratis Sekarang
                <FiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold
                           hover:bg-slate-50 active:scale-95 transition-all duration-200 shadow-sm"
              >
                Masuk
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex items-center gap-8 pt-4 border-t border-slate-100"
            >
              <MiniStat value="10K+" label="Pengguna aktif" delay={0.85} />
              <div className="w-px h-8 bg-slate-200" />
              <MiniStat value="Rp50M+" label="Transaksi tercatat" delay={0.9} />
              <div className="w-px h-8 bg-slate-200" />
              <MiniStat value="4.9★" label="Rating pengguna" delay={0.95} />
            </motion.div>
          </div>

          {/* ── RIGHT: Dashboard Mockup ── */}
          <div className="relative flex items-center justify-center">
            {/* Main dashboard card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated border border-slate-100 p-6 animate-float"
            >
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs font-medium">Selamat datang kembali 👋</p>
                  <p className="text-slate-900 font-bold text-base mt-0.5">Toko Sinar Jaya</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
              </div>

              {/* Revenue Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-indigo-200 text-xs font-medium mb-1">Total Pemasukan Bulan Ini</p>
                <p className="text-white font-black text-3xl">Rp 24,6 Jt</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                    <FiTrendingUp size={10} />
                    +12.4%
                  </div>
                  <span className="text-indigo-200 text-[10px]">dari bulan lalu</span>
                </div>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Pengeluaran", value: "Rp 9,2 Jt", color: "text-rose-500", bg: "bg-rose-50" },
                  { label: "Laba Bersih", value: "Rp 15,4 Jt", color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((item) => (
                  <div key={item.label} className={`p-4 rounded-2xl ${item.bg} border border-white`}>
                    <p className="text-slate-500 text-[10px] font-medium">{item.label}</p>
                    <p className={`font-black text-base mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Mini chart placeholder */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-end h-12">
                  {[30, 55, 40, 80, 60, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 mx-0.5 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: i === 5 ? "linear-gradient(to top, #6366f1, #818cf8)" : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                    <span key={d} className="flex-1 text-center text-[9px] text-slate-400">{d}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <FloatingBadge
              icon={<FiZap size={16} />}
              label="OCR Aktif"
              sub="Scan struk otomatis"
              color="bg-amber-500"
              className="-top-4 -left-4 md:-left-12"
              delay={0.8}
            />
            <FloatingBadge
              icon={<FiUsers size={16} />}
              label="128 Pelanggan"
              sub="Aktif minggu ini"
              color="bg-indigo-600"
              className="-bottom-4 -right-4 md:-right-10"
              delay={1.0}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
