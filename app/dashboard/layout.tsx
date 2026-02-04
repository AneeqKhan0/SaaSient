'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <div style={styles.logo}>S</div>
                    <div>
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
                        disabled
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
        ...(active ? styles.navItemActive : {}),
        ...(disabled ? styles.navItemDisabled : {}),
    } as React.CSSProperties;

    if (disabled) return <div style={base}>{label}</div>;

    return (
        <Link href={href} style={base as any}>
            {label}
        </Link>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        background: '#0b0b0b',
        color: '#fff',
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    },
    sidebar: {
        borderRight: '1px solid #1f1f1f',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#0f0f0f',
    },
    brand: { display: 'flex', alignItems: 'center', gap: 10 },
    logo: {
        width: 36,
        height: 36,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: '#ffffff',
        color: '#000',
        fontWeight: 900,
    },
    brandTitle: { fontWeight: 800, fontSize: 16, lineHeight: 1.1 },
    brandSub: { fontSize: 12, color: '#a8a8a8' },

    nav: { display: 'grid', gap: 8, marginTop: 6 },
    navItem: {
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #1f1f1f',
        background: '#0b0b0b',
        color: '#fff',
        textDecoration: 'none',
        fontWeight: 650,
        cursor: 'pointer',
    },
    navItemActive: { background: '#ffffff', color: '#000', border: '1px solid #ffffff' },
    navItemDisabled: {
        opacity: 0.45,
        cursor: 'not-allowed',
    },

    sidebarFooter: { marginTop: 'auto', display: 'grid', gap: 10 },
    userRow: {
        display: 'grid',
        gridTemplateColumns: '36px 1fr',
        gap: 10,
        alignItems: 'center',
        padding: 10,
        border: '1px solid #1f1f1f',
        borderRadius: 12,
        background: '#0b0b0b',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: '#1f1f1f',
        fontWeight: 900,
    },
    userEmail: {
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userRole: { fontSize: 12, color: '#a8a8a8' },
    signOut: {
        height: 40,
        borderRadius: 10,
        border: '1px solid #1f1f1f',
        background: '#0b0b0b',
        color: '#fff',
        fontWeight: 800,
        cursor: 'pointer',
    },

    main: { padding: 18 },
    content: {
        border: '1px solid #1f1f1f',
        borderRadius: 16,
        background: '#0f0f0f',
        padding: 18,
        minHeight: 'calc(100vh - 36px)',
    },
};