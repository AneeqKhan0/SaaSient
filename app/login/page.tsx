'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9';

export default function LoginPage() {
    const router = useRouter();

    const cardRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const reducedMotion = usePrefersReducedMotion();
    const [hovered, setHovered] = useState(false);
    const [suspendGlow, setSuspendGlow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

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

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        router.replace('/dashboard');
    }

    return (
        <main style={styles.page}>
            <div style={styles.bg} aria-hidden="true" />
            <div style={styles.noise} aria-hidden="true" />

            {/* Wrapper ensures card is perfectly centered */}
            <div style={styles.centerWrap}>
                <div ref={cardRef} className="glowCard" style={{ ...styles.card, ...cardStyle }}>
                    <div className="glowInner" style={styles.inner}>
                        <div style={styles.badgeRow}>
                            <span style={styles.pillDot} />
                            <span style={styles.pillText}>SaaSient Dashboard</span>
                        </div>

                        <div style={styles.header}>
                            <h1 style={styles.title}>Sign in</h1>
                            <p style={styles.subtitle}>Enter your email and password to sign in.</p>
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

                            <div style={styles.field}>
                                <label htmlFor="password" style={styles.label}>
                                    Password
                                </label>

                                {/* Password with eye toggle */}
                                <div style={styles.passwordWrap}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                        style={styles.passwordInput}
                                        onPointerEnter={() => setSuspendGlow(true)}
                                        onPointerLeave={() => setSuspendGlow(false)}
                                    />

                                    <button
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword((v) => !v)}
                                        style={styles.eyeBtn}
                                        onPointerEnter={() => setSuspendGlow(true)}
                                        onPointerLeave={() => setSuspendGlow(false)}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {message && <p style={styles.error}>{message}</p>}

                            <div
                                style={styles.actions}
                                onPointerEnter={() => setSuspendGlow(true)}
                                onPointerLeave={() => setSuspendGlow(false)}
                            >
                                <button type="submit" disabled={loading} className="btnPrimary">
                                    {loading ? 'Signing in…' : 'Sign in'}
                                </button>

                                <a href="mailto:support@saasient.com" className="btnSecondary">
                                    Contact Support
                                </a>
                            </div>
                        </form>

                        <p style={styles.footerNote}>
                            If you don’t have a user yet, create one in Supabase → Authentication → Users.
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

/** Tiny inline icons so you don't need any packages */
function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M10.6 10.6A2.75 2.75 0 0 0 13.4 13.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M6.2 6.7C3.8 8.6 2.25 12 2.25 12s3.75 7.5 9.75 7.5c1.9 0 3.6-.5 5.05-1.25"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M9 4.9A9.8 9.8 0 0 1 12 4.5c6 0 9.75 7.5 9.75 7.5s-1.1 2.2-3.2 4.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
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

    // Perfect centering regardless of background layers
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

    passwordWrap: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
    },

    passwordInput: {
        height: 46,
        width: '100%',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.22)',
        color: '#fff',
        padding: '0 44px 0 12px', // space for eye button
        outline: 'none',
    },

    eyeBtn: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 34,
        height: 34,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.80)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        padding: 0,
    },

    actions: {
        display: 'flex',
        gap: 12,
        marginTop: 6,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },

    error: {
        margin: 0,
        color: '#ff6b6b',
        fontSize: 13,
        lineHeight: 1.4,
        textAlign: 'center',
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
