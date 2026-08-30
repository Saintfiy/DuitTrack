'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Returns whether the user prefers reduced motion.
 * Defaults to false (animations enabled) during SSR.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Tracks whether the component has mounted (client-side only).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

/**
 * Mouse-following 3D tilt effect for a given element.
 * Returns a ref to attach to the element and the current transform string.
 *
 * @param maxTilt  - max degrees of tilt (default 8)
 * @param scale    - scale on hover (default 1.02)
 * @param disabled - set true to disable (e.g. reduced-motion)
 */
export function use3DTilt(
  maxTilt = 8,
  scale = 1.02,
  disabled = false
) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const reset = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const onMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rotX = -dy * maxTilt;
        const rotY = dx * maxTilt;
        ref.current.style.transform =
          `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
      });
    };

    const onLeave = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      ref.current!.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.willChange = 'transform';

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [maxTilt, scale, disabled]);

  return { ref, reset };
}

/**
 * Cursor-following subtle parallax for a background layer.
 * Returns a ref + onMouseMove handler for the parent container.
 */
export function useMouseParallax(strength = 0.015) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      const { clientX, clientY } = e;
      const dx = (clientX - window.innerWidth / 2) * strength;
      const dy = (clientY - window.innerHeight / 2) * strength;
      ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }, [strength]);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
      ref.current.style.willChange = 'transform';
    }
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { ref, onMouseMove };
}
