import React from 'react';
import { ACCENT } from '@/app/components/shared/constants';

export const adminHomeStyles: Record<string, React.CSSProperties> = {
    shell: {
        position: 'relative',
        padding: 18,
        borderRadius: 24,
        overflowX: 'hidden',
        overflowY: 'visible', // let the page scroll naturally, no inner scroll box
        background:
            'radial-gradient(900px 420px at 18% 0%, rgba(0,153,249,0.22), transparent 60%), radial-gradient(700px 320px at 88% 15%, rgba(0,153,249,0.12), transparent 65%), linear-gradient(180deg, #060606, #050505)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 120px rgba(0,0,0,0.65)',
        minHeight: '100%',
    },

    noise: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.06,
        backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.55%27/%3E%3C/svg%3E")',
    },

    headerRow: {
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 14,
        paddingBottom: 14,
        flexWrap: 'wrap',
    },

    h1: { fontSize: 26, fontWeight: 980, letterSpacing: -0.4 },
    sub: { color: 'rgba(255,255,255,0.62)', marginTop: 6, fontSize: 13 },

    adminBadge: {
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 20,
        background: 'rgba(0,153,249,0.15)',
        border: '1px solid rgba(0,153,249,0.35)',
        color: ACCENT,
        fontSize: 11,
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },

    livePill: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 999,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(0,0,0,0.20)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 14px 60px rgba(0,0,0,0.35)',
    },
    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: ACCENT,
        boxShadow: '0 0 0 8px rgba(0,153,249,0.14)',
        flex: '0 0 auto',
    },
    liveTextCol: { display: 'flex', flexDirection: 'column', lineHeight: 1.1 },
    liveTitle: { fontWeight: 950, fontSize: 13 },
    liveSub: { fontSize: 12, color: 'rgba(255,255,255,0.60)', marginTop: 2 },

    metricsGrid: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginTop: 14,
    },

    filtersSection: {
        position: 'relative',
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        background: 'rgba(0,0,0,0.22)',
        border: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
        boxSizing: 'border-box',
    },

    filtersRow: {
        display: 'flex',
        gap: 10,
        marginBottom: 10,
        flexWrap: 'wrap',
        width: '100%',
    },

    searchInput: {
        flex: 1,
        minWidth: 0,
        width: '100%',
        padding: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.92)',
        fontSize: 14,
        fontWeight: 600,
        outline: 'none',
        boxSizing: 'border-box',
    },

    select: {
        padding: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.92)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        minWidth: 0,
        boxSizing: 'border-box',
    },

    exportButtons: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
    },

    exportButton: {
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: 750,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },

    tableSection: {
        position: 'relative',
        marginTop: 14,
        marginBottom: 20,
        width: '100%',
        boxSizing: 'border-box',
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 900,
        color: 'rgba(255,255,255,0.92)',
        marginBottom: 10,
    },
};
