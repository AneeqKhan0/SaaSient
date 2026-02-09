'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ACCENT = '#0099f9';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                router.replace('/login');
                return;
            }
            setEmail(data.session.user.email ?? null);
        })();
    }, [router]);

    async function signOut() {
        await supabase.auth.signOut();
        router.replace('/login');
    }

    return (
        <div style={styles.shell}>
            {/* Ambient background layer to match login/home (subtle, not distracting) */}
            <div style={styles.bg} aria-hidden="true" />
            <div style={styles.noise} aria-hidden="true" />

            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <div style={styles.logoWrap} aria-hidden="true">
                        <div style={styles.logoInner}>S</div>
                    </div>

                    <div style={{ lineHeight: 1.05 }}>
                        <div style={styles.brandTitle}>SaaSient</div>
                        <div style={styles.brandSub}>Dashboard</div>
                    </div>
                </div>

                <nav style={styles.nav}>
                    <NavItem href="/dashboard" label="Overview" active={pathname === '/dashboard'} />
                    <NavItem
                        href="/dashboard/leads"
                        label="Qualified Leads"
                        active={pathname.startsWith('/dashboard/leads')}
                    />
                    <NavItem
                        href="/dashboard/whatsapp"
                        label="WhatsApp Conversations"
                        active={pathname.startsWith('/dashboard/whatsapp')}
                    />
                    <NavItem
                        href="/dashboard/appointments"
                        label="Appointments"
                        active={pathname.startsWith('/dashboard/appointments')}
                    />

                </nav>

                <div style={styles.sidebarFooter}>
                    <div style={styles.userRow}>
                        <div style={styles.avatar}>{(email?.[0] ?? 'U').toUpperCase()}</div>

                        <div style={{ overflow: 'hidden' }}>
                            <div style={styles.userEmail}>{email ?? '...'}</div>
                            <div style={styles.userRole}>Admin</div>
                        </div>
                    </div>

                    <button onClick={signOut} style={styles.signOut}>
                        Sign out
                    </button>
                </div>
            </aside>

            <main style={styles.main}>
                <div style={styles.content}>{children}</div>
            </main>

            <style jsx global>{`
        @keyframes bgFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-24px, 16px, 0) scale(1.02);
          }
          100% {
            transform: translate3d(24px, -16px, 0) scale(1.04);
          }
        }

        /* Nav hover: subtle (not flashy) */
        .navItemHoverable {
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
        }

        .navItemHoverable:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        /* Active pill: keep it SaaSient blue, not full white */
        .navItemActive {
          background: rgba(0, 153, 249, 0.16) !important;
          border-color: rgba(0, 153, 249, 0.35) !important;
          color: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 10px 30px rgba(0, 153, 249, 0.14);
        }

        /* Accessibility focus */
        .navItemHoverable:focus-visible {
          outline: 2px solid rgba(0, 153, 249, 0.75);
          outline-offset: 3px;
          border-radius: 12px;
        }

        @media (prefers-reduced-motion: reduce) {
          .navItemHoverable {
            transition: none !important;
          }
        }

        /* Mobile: sidebar becomes top bar */
        @media (max-width: 980px) {
          .dashShell {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
          }

          .dashSidebar {
            position: sticky;
            top: 0;
            z-index: 10;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            padding: 12px !important;
            background: rgba(10, 12, 16, 0.8) !important;
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }

          .dashNav {
            grid-auto-flow: column;
            grid-auto-columns: 1fr;
            overflow-x: auto;
            gap: 10px !important;
            padding-bottom: 6px;
            scrollbar-width: none;
          }
          .dashNav::-webkit-scrollbar {
            display: none;
          }

          .dashMain {
            padding: 14px !important;
          }

          .dashContent {
            min-height: auto !important;
          }

          .dashFooter {
            display: none !important; /* keep UI clean on mobile */
          }
        }
      `}</style>
        </div>
    );
}

function NavItem({
    href,
    label,
    active,
    disabled,
}: {
    href: string;
    label: string;
    active: boolean;
    disabled?: boolean;
}) {
    const base = {
        ...styles.navItem,
        ...(disabled ? styles.navItemDisabled : {}),
    } as React.CSSProperties;

    const className = [
        'navItemHoverable',
        active ? 'navItemActive' : '',
        disabled ? 'navItemDisabled' : '',
    ]
        .filter(Boolean)
        .join(' ');

    if (disabled) return <div style={base}>{label}</div>;

    return (
        <Link href={href} style={base as any} className={className}>
            {label}
        </Link>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        background: 'linear-gradient(180deg, #060606, #050505)',
        color: '#fff',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        position: 'relative',
        overflow: 'hidden',

        // for mobile CSS overrides
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },

    // attach class hooks for responsive styles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(undefined as any),

    bg: {
        position: 'absolute',
        inset: '-20%',
        pointerEvents: 'none',
        background: `
      radial-gradient(560px 380px at 10% 12%, rgba(0,153,249,0.16), transparent 66%),
      radial-gradient(560px 380px at 90% 14%, rgba(0,153,249,0.12), transparent 66%),
      radial-gradient(760px 520px at 55% 92%, rgba(0,153,249,0.10), transparent 72%)
    `,
        animation: 'bgFloat 30s ease-in-out infinite alternate',
        filter: 'blur(2px)',
        zIndex: 0,
    },

    noise: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.045,
        backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        zIndex: 0,
    },

    sidebar: {
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'rgba(10,12,16,0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 2,

        // hook classes for responsive CSS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },

    brand: { display: 'flex', alignItems: 'center', gap: 10 },

    logoWrap: {
        width: 38,
        height: 38,
        borderRadius: 14,
        background: `rgba(0,153,249,0.12)`,
        border: '1px solid rgba(0,153,249,0.28)',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 18px 40px rgba(0,153,249,0.12)',
    },

    logoInner: {
        width: 32,
        height: 32,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: ACCENT,
        color: '#001018',
        fontWeight: 950,
        letterSpacing: -0.2,
    },

    brandTitle: { fontWeight: 900, fontSize: 16, lineHeight: 1.1 },
    brandSub: { fontSize: 12, color: 'rgba(255,255,255,0.62)' },

    nav: {
        display: 'grid',
        gap: 10,
        marginTop: 6,

        // hook class
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },

    navItem: {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.22)',
        color: 'rgba(255,255,255,0.92)',
        textDecoration: 'none',
        fontWeight: 750,
        cursor: 'pointer',
    },

    navItemDisabled: {
        opacity: 0.45,
        cursor: 'not-allowed',
    },

    sidebarFooter: {
        marginTop: 'auto',
        display: 'grid',
        gap: 10,

        // hook class for responsive hide
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },

    userRow: {
        display: 'grid',
        gridTemplateColumns: '36px 1fr',
        gap: 10,
        alignItems: 'center',
        padding: 10,
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14,
        background: 'rgba(0,0,0,0.22)',
    },

    avatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontWeight: 900,
    },

    userEmail: {
        fontSize: 13,
        fontWeight: 750,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },

    userRole: { fontSize: 12, color: 'rgba(255,255,255,0.60)' },

    signOut: {
        height: 40,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.22)',
        color: 'rgba(255,255,255,0.92)',
        fontWeight: 850,
        cursor: 'pointer',
    },

    main: {
        padding: 18,
        zIndex: 2,

        // hook class
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },

    content: {
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        background: 'rgba(12,18,32,0.42)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 18,
        minHeight: 'calc(100vh - 36px)',
        boxShadow: '0 30px 110px rgba(0,0,0,0.55)',

        // hook class
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(undefined as any),
    },
};

/**
 * NOTE:
 * To enable the mobile responsive CSS hooks above without changing your structure,
 * add these classNames in JSX:
 * - shell: className="dashShell"
 * - sidebar: className="dashSidebar"
 * - nav: className="dashNav"
 * - main: className="dashMain"
 * - content: className="dashContent"
 * - sidebarFooter: className="dashFooter"
 *
 * If you want, I can apply those className changes directly too.
 */
