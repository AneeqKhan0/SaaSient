'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const ACCENT = '#0099f9';

export default function HomePage() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [suspendGlow, setSuspendGlow] = useState(false);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (reducedMotion || suspendGlow) return;

      const r = el.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width);
      const y = clamp(e.clientY - r.top, 0, r.height);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setPos({ x, y }));
    };

    const onEnter = () => setHovered(true);
    const onLeave = () => {
      setHovered(false);
      setSuspendGlow(false);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, suspendGlow]);

  const cardStyle = useMemo<React.CSSProperties>(() => {
    return {
      // @ts-ignore
      ['--mx' as any]: `${pos.x}px`,
      // @ts-ignore
      ['--my' as any]: `${pos.y}px`,
      // @ts-ignore
      ['--a' as any]: hovered && !suspendGlow ? 1 : 0,
    };
  }, [pos, hovered, suspendGlow]);

  return (
    <div style={styles.shell}>
      <div style={styles.bg} />
      <div style={styles.noise} />

      <div ref={cardRef} className="glowCard" style={{ ...styles.card, ...cardStyle }}>
        <div className="glowInner" style={styles.glowInner}>
          {/* Fixed alignment: dot + text centered on baseline */}
          <div style={styles.badgeRow} aria-label="SaaSient Dashboard badge">
            <span style={styles.pillDot} />
            <span style={styles.pillText}>SaaSient Dashboard</span>
          </div>

          <h1 style={styles.h1}>Lead &amp; Conversation Hub</h1>

          <p style={styles.sub}>
            Secure access to your WhatsApp + Voice leads, real-time conversations, and performance metrics.
          </p>

          {/* Disable card glow while interacting with buttons */}
          <div
            style={styles.btnRow}
            onPointerEnter={() => setSuspendGlow(true)}
            onPointerLeave={() => setSuspendGlow(false)}
          >
            <Link href="/login" className="btnPrimary">
              Login
            </Link>

            <a href="mailto:support@saasient.com" className="btnSecondary">
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ===== Ultra-clean, subtle edge glow ===== */
        .glowCard {
          position: relative;
          isolation: isolate;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        /* Small soft bloom */
        .glowCard::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: calc(var(--a, 0) * 0.75);

          background: radial-gradient(
            150px 150px at var(--mx, 50%) var(--my, 50%),
            rgba(0, 153, 249, 0.65),
            rgba(0, 153, 249, 0.12) 38%,
            transparent 68%
          );

          filter: blur(10px);
          transition: opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        /* Tight border hit */
        .glowCard::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: calc(var(--a, 0) * 1);

          background: radial-gradient(
            90px 90px at var(--mx, 50%) var(--my, 50%),
            rgba(0, 153, 249, 0.95),
            rgba(0, 153, 249, 0.3) 40%,
            transparent 70%
          );

          padding: 1.2px;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;

          transition: opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .glowCard > .glowInner {
          position: relative;
          z-index: 2;
        }

        .glowCard:hover {
          transform: translateY(-1px);
          box-shadow: 0 30px 120px rgba(0, 0, 0, 0.8);
        }

        /* ===== Buttons (NO hover animations, just clean states) ===== */
        .btnPrimary,
        .btnSecondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .btnPrimary {
          background: ${ACCENT};
          color: #001018;
          border: 1px solid rgba(0, 153, 249, 0.55);
        }

        .btnSecondary {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* No hover animation — but allow accessibility focus ring */
        .btnPrimary:hover,
        .btnSecondary:hover {
          filter: none;
          transform: none;
        }

        .btnPrimary:focus-visible,
        .btnSecondary:focus-visible {
          outline: 2px solid rgba(0, 153, 249, 0.75);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          .glowCard,
          .glowCard::before,
          .glowCard::after {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    position: 'relative',
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 18,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #060606, #050505)',
  },


  bg: {
    position: 'absolute',
    inset: '-20%',
    background: `
    radial-gradient(520px 360px at 12% 10%, rgba(0,153,249,0.22), transparent 65%),
    radial-gradient(520px 360px at 88% 12%, rgba(0,153,249,0.18), transparent 65%),

    radial-gradient(620px 420px at 50% 92%, rgba(0,153,249,0.14), transparent 70%),
    radial-gradient(520px 360px at 20% 88%, rgba(0,153,249,0.10), transparent 70%)
  `,
    animation: 'bgFloat 28s ease-in-out infinite alternate',
    filter: 'blur(2px)',
  },

  noise: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.05,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
  },

  card: {
    width: 'min(560px, 100%)',
    borderRadius: 22,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(12,18,32,0.55)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    overflow: 'hidden',
  },

  glowInner: {
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center', // ✅ fixed alignment
    justifyContent: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    lineHeight: 1, // ✅ prevents odd vertical offset
  },

  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ACCENT,
    flex: '0 0 auto', // ✅ prevents stretching
  },

  pillText: {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.85)',
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1, // ✅ perfect baseline match
  },

  h1: { marginTop: 14, fontSize: 28, fontWeight: 900 },

  sub: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 500,
    fontSize: 14,
    lineHeight: 1.6,
  },

  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};
