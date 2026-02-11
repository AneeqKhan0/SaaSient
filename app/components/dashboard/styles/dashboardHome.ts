import React from 'react';
import { ACCENT } from '@/app/components/shared/constants';

export const homeStyles: Record<string, React.CSSProperties> = {
    shell: {
        position: 'relative',
        minHeight: 'calc(100vh - 60px)',
        padding: 18,
        borderRadius: 24,
        overflow: 'hidden',
        background:
            'radial-gradient(900px 420px at 18% 0%, rgba(0,153,249,0.22), transparent 60%), radial-gradient(700px 320px at 88% 15%, rgba(0,153,249,0.12), transparent 65%), linear-gradient(180deg, #060606, #050505)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 120px rgba(0,0,0,0.65)',
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
    },

    h1: { fontSize: 26, fontWeight: 980, letterSpacing: -0.4 },
    sub: { color: 'rgba(255,255,255,0.62)', marginTop: 6, fontSize: 13 },

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

    alert: {
        position: 'relative',
        border: '1px solid rgba(255,90,90,0.35)',
        background: 'rgba(255,60,60,0.08)',
        color: '#ffb4b4',
        padding: 12,
        borderRadius: 16,
        marginBottom: 14,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },

    statsGrid: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
    },

    actions: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 12,
        marginTop: 12,
    },
};
