'use client';

import React from 'react';
import Link from 'next/link';
import { ACCENT } from '@/app/components/shared/constants';

type NavItemProps = {
    href: string;
    label: string;
    active: boolean;
    disabled?: boolean;
};

export function NavItem({ href, label, active, disabled }: NavItemProps) {
    const base: React.CSSProperties = {
        ...styles.navItem,
        ...(disabled ? styles.navItemDisabled : {}),
    };

    const className = [
        'navItemHoverable',
        active ? 'navItemActive' : '',
        disabled ? 'navItemDisabled' : '',
    ]
        .filter(Boolean)
        .join(' ');

    if (disabled) return <div style={base}>{label}</div>;

    return (
        <Link href={href} style={base} className={className}>
            {label}
        </Link>
    );
}

const styles: Record<string, React.CSSProperties> = {
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
};
