'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  FiArrowRight, FiTrendingUp, FiCpu, FiShield,
  FiZap, FiBarChart2, FiUsers, FiStar
} from 'react-icons/fi';

/* ─── Animation variants ──────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;
const spring = { type: 'spring', stiffness: 200, damping: 22 } as const;

/** Fade up — subtle, for small elements */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease, delay },
  }),
};

/** Dramatic fade + blur up — for headings & hero elements */
const fadeUpBlur = {
  hidden: { opacity: 0, y: 56, filter: 'blur(10px)' },
  show: (delay = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.95, ease, delay },
  }),
};

/** 3D card entrance — perspective tilt on scroll reveal */
const card3D = {
  hidden: { opacity: 0, y: 48, rotateX: 10, scale: 0.96, transformPerspective: 1000 },
  show: (delay = 0) => ({
    opacity: 1, y: 0, rotateX: 0, scale: 1,
    transition: { duration: 0.85, ease, delay },
  }),
};

/** Slide in from left */
const slideLeft = {
  hidden: { opacity: 0, x: -64, filter: 'blur(6px)' },
  show: (delay = 0) => ({
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { duration: 0.85, ease, delay },
  }),
};

/** Slide in from right */
const slideRight = {
  hidden: { opacity: 0, x: 64, filter: 'blur(6px)' },
  show: (delay = 0) => ({
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { duration: 0.85, ease, delay },
  }),
};

/** Scale pop — for CTA and badges */
const scaleIn = {
  hidden: { opacity: 0, scale: 0.82, filter: 'blur(6px)' },
  show: (delay = 0) => ({
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.7, ease, delay },
  }),
};

/** Stagger container — used for groups */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};

/** Stat item — counts up feel */
const staggerItem = {
  hidden: { opacity: 0, y: 32, scale: 0.85 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease } },
};

/** Word-split headline helper */
function AnimatedWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', marginRight: i < words.length - 1 ? '0.28em' : 0 }}
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease, delay: delay + i * 0.07 }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/** Animated number counter */
function useCountUp(target: string, inView: boolean) {
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const suffix = target.replace(/[0-9.]/g, '');
    if (isNaN(num)) { setDisplay(target); return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = num * eased;
      setDisplay((num % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return display;
}

function StatCard({ value, label }: { value: string; label: string }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, inView);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <motion.div ref={ref} variants={staggerItem} whileHover={{ scale: 1.07, y: -3 }} transition={spring} className="cursor-default">
      <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{count}</div>
      <div className="text-sm text-white/50 font-medium">{label}</div>
    </motion.div>
  );
}

/* ─── 3D Tilt hook  RAF-based, GPU only ─────────────────── */
function use3DTilt(maxTilt = 7, scaleVal = 1.015, disabled = false) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    el.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
    el.style.willChange = 'transform';

    const onMove = (e: MouseEvent) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        ref.current.style.transform =
          `perspective(1200px) rotateX(${-dy * maxTilt}deg) rotateY(${dx * maxTilt}deg) scale(${scaleVal})`;
      });
    };
    const onLeave = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (ref.current)
        ref.current.style.transform =
          'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [maxTilt, scaleVal, disabled]);

  return ref;
}

/* ─── Reduced-motion hook ─────────────────────────────────── */
function usePrefersReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setV(mq.matches);
    const h = (e: MediaQueryListEvent) => setV(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return v;
}

/* ─── Page-load skeleton/intro ────────────────────────────── */
function PageIntro({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="contents"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Navbar scroll-aware ─────────────────────────────────── */
function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);
  return scrolled;
}

/* ─── Data ────────────────────────────────────────────────── */
const stats = [
  { value: '10K+', label: 'Pengguna Aktif' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Rp 50M+', label: 'Transaksi Tercatat' },
  { value: '4.9 ⭐', label: 'Rating Pengguna' },
];

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const reduced = usePrefersReducedMotion();
  const scrolled = useScrolled();

  /* Hero parallax */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const rawHeroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroY = useSpring(rawHeroY, { stiffness: 80, damping: 20 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  /* Showcase section parallax */
  const showcaseRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: showcaseSP } = useScroll({ target: showcaseRef, offset: ['start end', 'end start'] });
  const showcaseY = useTransform(showcaseSP, [0, 1], ['4%', '-4%']);

  /* 3D tilt  dashboard frame */
  const tiltRef = use3DTilt(5, 1.01, reduced);

  /* Mouse-parallax for hero glows */
  const glowRef = useRef<HTMLDivElement>(null);
  const glowRaf = useRef<number | null>(null);
  const onHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reduced || !glowRef.current) return;
    if (glowRaf.current) cancelAnimationFrame(glowRaf.current);
    glowRaf.current = requestAnimationFrame(() => {
      if (!glowRef.current) return;
      const dx = (e.clientX - window.innerWidth / 2) * 0.012;
      const dy = (e.clientY - window.innerHeight / 2) * 0.012;
      glowRef.current.style.transform = `translate(${dx}px,${dy}px)`;
    });
  }, [reduced]);
  useEffect(() => () => { if (glowRaf.current) cancelAnimationFrame(glowRaf.current); }, []);

  return (
    <PageIntro>
      <div className="relative min-h-screen bg-darker overflow-x-hidden">

        {/* ── SPLINE ROBOT BACKGROUND ── */}
        <div className="fixed inset-0 z-0 w-full h-full pointer-events-none overflow-hidden">
          <iframe
            src="https://my.spline.design/nexbotrobotcharacterconcept-FNsuGhtZ8mqBi4nYmcAU0QP3/"
            frameBorder="0"
            width="100%"
            title="DuitTrack AI Robot Background"
            className="w-full h-[calc(100%+80px)]"
          />
          {/* Subtle dark overlay  keeps robot visible but ensures text contrast */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.55) 0%, rgba(9,9,11,0.35) 45%, rgba(9,9,11,0.65) 100%)' }}
          />
        </div>

        {/* ── PAGE CONTENT ── */}
        <div className="relative z-10">

          {/* ── NAVBAR ── */}
          <motion.nav
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="fixed top-0 w-full z-50 px-6 py-4 transition-all duration-300"
            style={{
              backdropFilter: 'blur(24px)',
              background: scrolled ? 'rgba(9,9,11,0.85)' : 'rgba(9,9,11,0.6)',
              borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <motion.div
                className="text-2xl font-black tracking-tight select-none"
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span className="gradient-text">Duit</span>
                <span className="text-white">Track</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="relative text-white/60 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/[0.07]"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="btn-animate inline-flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-xl bg-primary text-darker shadow-lg shadow-primary/20"
                >
                  Daftar Gratis <FiArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.nav>

          {/* ── HERO ── */}
          <section
            ref={heroRef}
            className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20 overflow-hidden"
            onMouseMove={onHeroMouseMove}
          >

            <motion.div
              style={reduced ? {} : { y: heroY, opacity: heroOpacity }}
              className="max-w-3xl mx-auto relative z-10"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6, ease }}
                className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md"
                style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
              >
                <FiStar size={12} />
                Platform Keuangan UMKM #1 Indonesia
              </motion.div>

              {/* Headline  word-by-word stagger */}
              <motion.h1
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.85, ease }}
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight drop-shadow-2xl"
              >
                <span className="text-white">
                  Pembukuan Pintar
                </span>
                <br />
                <span className="text-white">untuk UMKM Indonesia</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.68, duration: 0.7, ease }}
                className="text-lg md:text-xl text-white/65 mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-lg"
              >
                AI + Analitik + OCR dalam satu platform. Kelola keuangan bisnis Anda seperti CEO kelas dunia  tanpa kerumitan.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.82, duration: 0.65, ease }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/register"
                  className="btn-animate group inline-flex items-center gap-2 px-8 py-4 bg-primary text-darker font-bold rounded-2xl text-lg shadow-2xl shadow-primary/35"
                >
                  Mulai Gratis Sekarang
                  <FiArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/login"
                  className="btn-animate inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-2xl text-lg border border-white/20 text-white hover:bg-white/[0.08] backdrop-blur-md"
                >
                  Login ke Akun
                </Link>
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={reduced ? {} : { y: [0, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-5 h-8 rounded-full border-2 border-white/25 flex items-start justify-center pt-1.5"
              >
                <div className="w-1 h-1.5 bg-white/45 rounded-full" />
              </motion.div>
            </motion.div>
          </section>

          {/* ── PRODUCT SHOWCASE ── */}
          <section
            ref={showcaseRef}
            className="relative py-20 px-6 overflow-hidden"
          >
            {/* Radial vignette behind frame only */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(9,9,11,0.7) 0%, rgba(9,9,11,0.2) 60%, transparent 100%)' }}
            />

            <div className="max-w-5xl mx-auto relative">
              {/* Label */}
              <motion.p
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp} custom={0}
                className="text-center text-white/40 text-sm font-medium tracking-widest uppercase inline-flex items-center gap-2 w-full justify-center mb-6"
              >
                <span className="w-5 h-px bg-white/20" />
                Lihat sendiri
                <span className="w-5 h-px bg-white/20" />
              </motion.p>
              <motion.h2
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUpBlur} custom={0.1}
                className="text-center text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-3"
              >
                <AnimatedWords text="Dashboard yang terasa seperti milik CEO" delay={0.12} />
              </motion.h2>
              <motion.p
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp} custom={0.35}
                className="text-center text-white/45 text-base max-w-md mx-auto mb-10"
              >
                Semua angka bisnis kamu — pendapatan, pengeluaran, laba, inventori — dalam satu tampilan yang jernih.
              </motion.p>

              {/* Browser frame with 3D tilt */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={card3D}
                custom={0.1}
                className="relative"
                style={reduced ? {} : { y: showcaseY }}
              >
                <div
                  ref={tiltRef}
                  className="relative tilt-card"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Backdrop blur behind the whole frame */}
                  <div
                    className="absolute -inset-6 rounded-3xl pointer-events-none"
                    style={{ backdropFilter: 'blur(20px)', background: 'rgba(9,9,11,0.45)' }}
                  />
                  {/* Browser chrome */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(10,10,14,0.95)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 60px 120px -20px rgba(0,0,0,0.8), 0 0 80px -10px rgba(139,92,246,0.15)',
                    }}
                  >
                    {/* Title bar */}
                    <div
                      className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07]"
                      style={{ background: 'rgba(15,15,20,0.9)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <div
                        className="mx-auto flex items-center gap-2 px-4 py-1 rounded-md text-xs text-white/30 font-mono"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400/60" />
                        app.duittrack.id/dashboard
                      </div>
                      <div className="w-16" />
                    </div>
                    {/* Screenshot */}
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <Image
                        src="/dashboard-preview.png"
                        alt="DuitTrack Dashboard  tampilan lengkap keuangan bisnis UMKM"
                        fill
                        className="object-cover object-top"
                        priority
                        quality={95}
                      />
                    </div>
                  </div>
                </div>

              </motion.div>

            </div>
          </section>

          {/* ── STATS STRIP ── */}
          <section
            className="border-y border-white/10 py-14 px-6"
            style={{ background: 'rgba(9,9,11,0.08)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              {stats.map((s, i) => (
                <StatCard key={i} value={s.value} label={s.label} />
              ))}
            </motion.div>
          </section>

          {/* ── FEATURES  Premium Bento Grid ── */}
          <section
            id="fitur"
            className="relative py-24 px-6 overflow-hidden"
            style={{ background: 'rgba(9,9,11,0.08)', backdropFilter: 'blur(2px)' }}
          >
            {/* Ambient glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.10) 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[350px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
            </div>

            <div className="max-w-6xl mx-auto relative">
              {/* Header */}
              <div className="mb-14">
                <motion.p
                  initial="hidden" whileInView="show" viewport={{ once: true }}
                  variants={slideLeft} custom={0}
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase mb-5 text-white/50"
                >
                  <span className="w-4 h-px bg-white/30" />
                  Fitur Unggulan
                </motion.p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] max-w-2xl">
                  <AnimatedWords text="Semua yang kamu butuhkan," delay={0.05} />{' '}
                  <AnimatedWords text="dalam satu tempat" className="text-white" delay={0.3} />
                </h2>
                <p className="mt-4 text-white/45 text-base max-w-lg leading-relaxed">
                  Satu ekosistem financial intelligence  dirancang khusus untuk UMKM Indonesia yang ingin tumbuh lebih cerdas.
                </p>
              </div>

              {/* ── ROW 1: Featured AI Card ── */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                variants={card3D}
                custom={0}
                className="mb-4 group cursor-default"
                whileHover={reduced ? {} : { y: -3 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <div
                  className="relative overflow-hidden rounded-3xl transition-shadow duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,22,0.97) 0%, rgba(12,12,16,0.97) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Hover border glow */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }} />
                  <div className="absolute top-0 left-0 w-[500px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
                  <div className="absolute bottom-0 right-0 w-[300px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />

                  <div className="relative z-10 grid md:grid-cols-2 gap-0">
                    {/* Left: Text */}
                    <div className="p-8 md:p-10 flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                          </span>
                          AI Aktif — Powered by Gemini
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight leading-tight">
                          Asisten Keuangan AI
                        </h3>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                          Tanya apa saja tentang bisnis kamu. AI menganalisis data real-time dan memberikan rekomendasi yang actionable  24/7.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {['Cash Flow Analysis', 'Prediksi Pendapatan', 'Deteksi Anomali'].map(tag => (
                            <motion.span
                              key={tag}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
                              whileHover={reduced ? {} : { scale: 1.05 }}
                              transition={{ duration: 0.18 }}
                            >
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Mini AI UI */}
                    <div className="p-6 md:p-8 flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(14,14,18,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(10,10,14,0.7)' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-white/70">DuitTrack AI</span>
                            <span className="ml-auto text-[10px] text-green-400 font-medium">● Online</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex justify-end">
                              <div className="text-xs text-white/70 px-3 py-2 rounded-xl rounded-tr-sm max-w-[80%]" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                Bagaimana kondisi cash flow bulan ini?
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 bg-white/20" />
                              <div className="flex-1 space-y-2">
                                <div className="text-xs text-white/80 px-3 py-2 rounded-xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  📊 Cash flow bulan ini <span className="text-green-400 font-semibold">+Rp 12.4jt</span> vs bulan lalu. Pendapatan naik <span className="text-green-400 font-semibold">18%</span>, namun pengeluaran operasional naik <span className="text-amber-400 font-semibold">12%</span>.
                                </div>
                                <div className="text-xs text-white/80 px-3 py-2 rounded-xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  💡 <span className="text-white/80 font-semibold">Rekomendasi:</span> Kurangi biaya operasional di kategori <em>Pengiriman</em> — ada potensi penghematan Rp 2.1jt/bulan.
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 px-2 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[10px] text-white/40 font-medium">Tren Pendapatan</span>
                                <span className="text-[10px] text-green-400 font-semibold">▲ 18%</span>
                              </div>
                              <svg viewBox="0 0 200 40" className="w-full h-8" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <path d="M0,35 C20,32 40,28 60,25 C80,22 100,20 120,16 C140,12 160,10 180,7 L200,5 L200,40 L0,40 Z" fill="url(#sparkGrad)" />
                                <path d="M0,35 C20,32 40,28 60,25 C80,22 100,20 120,16 C140,12 160,10 180,7 L200,5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </div>
                          </div>
                          <div className="px-4 py-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="flex-1 text-xs text-white/25 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>Tanya AI keuanganmu…</div>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── ROW 2: Analytics + OCR ── */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Analytics */}
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={slideLeft}
                  custom={0}
                  whileHover={reduced ? {} : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group cursor-default"
                >
                  <div
                    className="relative overflow-hidden rounded-2xl h-full transition-shadow duration-300"
                    style={{ background: 'rgba(14,10,28,0.9)', border: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.35)' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
                    <div className="p-6">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">Analitik Real-time</h3>
                      <p className="text-white/45 text-sm leading-relaxed mb-5">Dashboard interaktif dengan prediksi berbasis data  selalu up-to-date.</p>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-end gap-1.5 h-14">
                          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-sm transition-all duration-500 group-hover:opacity-100"
                              style={{ height: `${h}%`, background: i === 10 ? 'rgba(255,255,255,0.7)' : `rgba(255,255,255,${0.12 + (i / 12) * 0.25})`, opacity: 0.9 }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[10px] text-white/30">Nov</span>
                          <span className="text-[10px] text-white/30">Okt</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div>
                          <div className="text-xs text-white/35 mb-0.5">Pendapatan</div>
                          <div className="text-sm font-bold text-white">Rp 77.3jt</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                          <div className="text-xs text-white/35 mb-0.5">vs bulan lalu</div>
                          <div className="text-sm font-bold text-green-400">▲ 18.4%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* OCR */}
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={slideRight}
                  custom={0.08}
                  whileHover={reduced ? {} : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group cursor-default"
                >
                  <div
                    className="relative overflow-hidden rounded-2xl h-full transition-shadow duration-300"
                    style={{ background: 'rgba(8,20,22,0.9)', border: '1px solid rgba(34,211,238,0.15)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(34,211,238,0.35)' }} />
                    <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)' }} />
                    <div className="p-6">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4" style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></svg>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">Scan Struk (OCR)</h3>
                      <p className="text-white/45 text-sm leading-relaxed mb-5">Foto struk → AI ekstrak &amp; catat transaksi otomatis dalam hitungan detik.</p>
                      <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-4 py-3">
                          <motion.div
                            animate={reduced ? {} : { y: [0, 80, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-x-0 h-0.5 z-10 pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.8), transparent)' }}
                          />
                          <div className="text-[10px] font-bold text-white/50 text-center mb-2 tracking-widest">TOKO MAKMUR JAYA</div>
                          <div className="space-y-1">
                            {[
                              { label: 'Kopi Susu', val: 'Rp 25.000', done: true },
                              { label: 'Nasi Goreng', val: 'Rp 35.000', done: true },
                              { label: 'Es Teh', val: 'Rp 8.000', done: false },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center justify-between py-0.5">
                                <span className="text-[11px] text-white/50">{row.label}</span>
                                <span className="text-[11px] font-semibold" style={{ color: row.done ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.3)' }}>{row.val}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/[0.07] flex justify-between">
                            <span className="text-[11px] font-bold text-white/60">Total</span>
                            <span className="text-[11px] font-black text-cyan-400">Rp 68.000</span>
                          </div>
                        </div>
                        <div className="px-4 py-2 flex items-center gap-1.5" style={{ background: 'rgba(34,211,238,0.08)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          <span className="text-[11px] font-semibold text-cyan-400">Terdeteksi &amp; dicatat otomatis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── ROW 3: Security + CRM + Marketplace ── */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Security */}
                <motion.div
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}
                  variants={card3D} custom={0.0}
                  whileHover={reduced ? {} : { y: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="group cursor-default"
                >
                  <div className="relative overflow-hidden rounded-2xl h-full transition-shadow duration-300" style={{ background: 'rgba(8,18,12,0.9)', border: '1px solid rgba(74,222,128,0.13)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(74,222,128,0.35)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(74,222,128,0.07) 0%, transparent 70%)' }} />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.2)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>Bank-Grade</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Aman &amp; Privat</h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">Enkripsi AES-256, Row-Level Security, dan audit trail lengkap.</p>
                      <div className="space-y-2">
                        {['SSL/TLS Encrypted', 'Row-Level Security', '2FA Authentication'].map(label => (
                          <div key={label} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74,222,128,0.15)' }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <span className="text-[11px] text-white/50">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CRM */}
                <motion.div
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}
                  variants={card3D} custom={0.1}
                  whileHover={reduced ? {} : { y: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="group cursor-default"
                >
                  <div className="relative overflow-hidden rounded-2xl h-full transition-shadow duration-300" style={{ background: 'rgba(20,14,8,0.9)', border: '1px solid rgba(251,191,36,0.13)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.35)' }} />
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.07) 0%, transparent 70%)' }} />
                    <div className="p-6">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">CRM Pelanggan</h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">Kenali pelanggan terbaik &amp; pola transaksi mereka.</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Budi S.', spend: 'Rp 4.2jt', rank: 1 },
                          { name: 'Rina A.', spend: 'Rp 3.8jt', rank: 2 },
                          { name: 'Hendra T.', spend: 'Rp 2.9jt', rank: 3 },
                        ].map(c => (
                          <div key={c.name} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black" style={{ background: c.rank === 1 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)', color: c.rank === 1 ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                              {c.rank}
                            </div>
                            <span className="text-xs text-white/65 flex-1">{c.name}</span>
                            <span className="text-[11px] font-bold text-amber-400">{c.spend}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Marketplace */}
                <motion.div
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}
                  variants={card3D} custom={0.2}
                  whileHover={reduced ? {} : { y: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="group cursor-default"
                >
                  <div className="relative overflow-hidden rounded-2xl h-full transition-shadow duration-300" style={{ background: 'rgba(10,14,22,0.9)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.35)' }} />
                    <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
                    <div className="p-6">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4" style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Integrasi Marketplace</h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-4">Sinkronisasi otomatis order dari semua channel penjualan.</p>
                      <div className="space-y-2">
                        {[
                          { name: 'Tokopedia', color: '#16a34a', orders: '142 order' },
                          { name: 'Shopee', color: '#ea580c', orders: '98 order' },
                          { name: 'TikTok Shop', color: '#ec4899', orders: '67 order' },
                        ].map(mp => (
                          <div key={mp.name} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: mp.color }} />
                            <span className="text-xs text-white/65 flex-1">{mp.name}</span>
                            <span className="text-[10px] font-semibold text-white/35">{mp.orders}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── CTA BOTTOM ── */}
          <section className="py-28 px-6" style={{ background: 'rgba(9,9,11,0.08)', backdropFilter: 'blur(2px)' }}>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={scaleIn}
              custom={0}
              className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl p-12 text-center border border-white/10"
              style={{ background: 'rgba(14,14,18,0.75)', backdropFilter: 'blur(24px)' }}
            >
              <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)' }} />
              <div className="relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, ease }}
                  className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
                >
                  Siap kelola bisnis<br /><span className="text-white">lebih cerdas?</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.55 }}
                  className="text-white/60 text-lg mb-8"
                >
                  Gratis selamanya untuk fitur dasar. Upgrade kapan saja.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25, duration: 0.5, ease }}
                >
                  <Link
                    href="/register"
                    className="btn-animate group inline-flex items-center gap-2 px-10 py-4 bg-primary text-darker font-black rounded-2xl text-lg shadow-2xl shadow-primary/30"
                  >
                    Mulai Gratis  Daftar Sekarang
                    <FiArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ── FOOTER ── */}
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border-t border-white/10 py-10 px-6"
            style={{ background: 'rgba(9,9,11,0.08)', backdropFilter: 'blur(2px)' }}
          >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xl font-black">
                <span className="gradient-text">Duit</span><span className="text-white">Track</span>
              </div>
              <p className="text-white/30 text-sm">© {new Date().getFullYear()} DuitTrack. Hak cipta dilindungi undang-undang.</p>
              <div className="flex items-center gap-6 text-sm text-white/40">
                <Link href="/login" className="hover:text-white transition-colors duration-200">Masuk</Link>
                <Link href="/register" className="hover:text-white transition-colors duration-200">Daftar</Link>
              </div>
            </div>
          </motion.footer>

        </div>
      </div>
    </PageIntro>
  );
}
