import React from 'react';
import Link from 'next/link';
import { ACCENT } from '@/app/components/shared/constants';

type ActionCardProps = {
    href: string;
    title: string;
    description: string;
    badgeLabel?: string;
};

export function ActionCard({ href, title, description, badgeLabel = 'Open' }: ActionCardProps) {
    return (
        <Link href={href} style={styles.card}>
            <div style={styles.top}>
                <div style={styles.title}>{title}</div>
                <div style={styles.badge}>{badgeLabel}</div>
            </div>
            <div style={styles.text}>{description}</div>
        </Link>
    );
}

const styles: Record<string, React.CSSProperties> = {
    card: {
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 55px rgba(0,0,0,0.40)',
        padding: 14,
        color: '#fff',
        textDecoration: 'none',
    },
    top: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    title: { fontWeight: 980, fontSize: 15, letterSpacing: -0.2 },
    badge: {
        fontSize: 12,
        fontWeight: 950,
        padding: '6px 12px',
        borderRadius: 999,
        color: '#001018',
        background: ACCENT,
        boxShadow: '0 10px 30px rgba(0,153,249,0.25)',
    },
    text: { color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 13 },
};
