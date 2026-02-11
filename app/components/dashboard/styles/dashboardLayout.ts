import React from 'react';
import { ACCENT } from '@/app/components/shared/constants';

export const layoutStyles: Record<string, React.CSSProperties> = {
    shell: {
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        background: 'linear-gradient(180deg, #060606, #050505)',
        color: '#fff',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        position: 'relative',
        overflow: 'hidden',
    },

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
    },

    brand: { display: 'flex', alignItems: 'center', gap: 10 },

    logoWrap: {
        width: 38,
        height: 38,
        borderRadius: 14,
        background: 'rgba(0,153,249,0.12)',
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
    },

    sidebarFooter: {
        marginTop: 'auto',
        display: 'grid',
        gap: 10,
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
    },
};
