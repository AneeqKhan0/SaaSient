'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9';

export default function ForgotPasswordPage() {
    const router = useRouter();

    const cardRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const reducedMotion = usePrefersReducedMotion();
    const [hovered, setHovered] = useState(false);
    const [suspendGlow, setSuspendGlow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // If already logged in, go straight to dashboard
    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) router.replace('/dashboard');
        })();
    }, [router]);

    // Card glow tracking
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

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const redirectTo = `${window.location.origin}/auth/update-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            });

            if (error) throw error;

            setMessage('If that email exists, we’ve sent a password reset link.');
        } catch (err: any) {
            setMessage(err?.message ?? 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={styles.page}>
            <div style={styles.bg} aria-hidden="true" />
            <div style={styles.noise} aria-hidden="true" />

            <div style={styles.centerWrap}>
                <div ref={cardRef} className="glowCard" style={{ ...styles.card, ...cardStyle }}>
                    <div className="glowInner" style={styles.inner}>
                        <div style={styles.badgeRow}>
                            <span style={styles.pillDot} />
                            <span style={styles.pillText}>SaaSient Dashboard</span>
                        </div>

                        <div style={styles.header}>
                            <h1 style={styles.title}>Reset password</h1>
                            <p style={styles.subtitle}>
                                Enter your email and we’ll send you a secure reset link.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} style={styles.form}>
                            <div style={styles.field}>
                                <label htmlFor="email" style={styles.label}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    required
                                    style={styles.input}
                                    onPointerEnter={() => setSuspendGlow(true)}
                                    onPointerLeave={() => setSuspendGlow(false)}
                                />
                            </div>

                            {message && <p style={styles.info}>{message}</p>}

                            <div
                                style={styles.actions}
                                onPointerEnter={() => setSuspendGlow(true)}
                                onPointerLeave={() => setSuspendGlow(false)}
                            >
                                <button type="submit" disabled={loading} className="btnPrimary">
                                    {loading ? 'Sending…' : 'Send reset link'}
                                </button>

                                <Link href="/login" className="btnSecondary">
                                    Back to login
                                </Link>
                            </div>
                        </form>

                        <p style={styles.footerNote}>
                            Tip: Check your spam/junk folder if you don’t see the email within a minute.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes bgFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-30px, 20px, 0) scale(1.03);
          }
          100% {
            transform: translate3d(30px, -20px, 0) scale(1.05);
          }
        }

        .glowCard {
          position: relative;
          isolation: isolate;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        .glowCard::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: calc(var(--a, 0) * 0.75);

          background: radial-gradient(
            120px 120px at var(--mx, 50%) var(--my, 50%),
            rgba(0, 153, 249, 0.62),
            rgba(0, 153, 249, 0.12) 38%,
            transparent 68%
          );

          filter: blur(10px);
          transition: opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .glowCard::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: calc(var(--a, 0) * 1);

          background: radial-gradient(
            80px 80px at var(--mx, 50%) var(--my, 50%),
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

        /* Buttons: NO hover animations */
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
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
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
        </main>
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
    page: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #060606, #050505)',
        color: '#fff',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    },

    centerWrap: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
        position: 'relative',
        zIndex: 2,
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
        pointerEvents: 'none',
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

    inner: {
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },

    badgeRow: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        lineHeight: 1,
    },

    pillDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: ACCENT,
        flex: '0 0 auto',
    },

    pillText: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1,
    },

    header: { marginTop: 14 },

    title: { margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: -0.4 },

    subtitle: { margin: '8px 0 0 0', color: 'rgba(255,255,255,0.66)', fontSize: 14, lineHeight: 1.6 },

    form: {
        display: 'grid',
        gap: 14,
        marginTop: 20,
        width: 'min(420px, 100%)',
        textAlign: 'left',
    },

    field: { display: 'grid', gap: 8 },

    label: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.78)',
        letterSpacing: 0.2,
    },

    input: {
        height: 46,
        width: '100%',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.22)',
        color: '#fff',
        padding: '0 12px',
        outline: 'none',
    },

    actions: {
        display: 'flex',
        gap: 12,
        marginTop: 6,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },

    info: {
        margin: 0,
        color: 'rgba(255,255,255,0.80)',
        fontSize: 13,
        lineHeight: 1.5,
        textAlign: 'center',
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
    },

    footerNote: {
        marginTop: 14,
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        lineHeight: 1.4,
        textAlign: 'center',
        maxWidth: 480,
    },
};
