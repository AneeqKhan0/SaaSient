'use client';

import { CSSProperties, ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={styles.shell}>
      <style>{keyframes}</style>
      <style jsx global>{`
        @media (max-width: 640px) {
          .authShell {
            padding: 16px !important;
          }
          .authOrb1, .authOrb2, .authOrb3 {
            width: 300px !important;
            height: 300px !important;
          }
        }
      `}</style>

      {/* Deep base with gradient */}
      <div style={styles.baseBg} aria-hidden="true" />

      {/* Animated gradient mesh — visible colored blobs */}
      <div style={styles.orb1} className="authOrb1" aria-hidden="true" />
      <div style={styles.orb2} className="authOrb2" aria-hidden="true" />
      <div style={styles.orb3} className="authOrb3" aria-hidden="true" />

      {/* Technical perspective grid */}
      <div style={styles.gridWrap} aria-hidden="true">
        <div style={styles.grid} />
      </div>

      {/* Radial fade so grid softens at edges */}
      <div style={styles.gridFade} aria-hidden="true" />

      {/* Noise texture for grain */}
      <div style={styles.noise} aria-hidden="true" />

      {/* Content on top */}
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const keyframes = `
  @keyframes drift1 {
    0%   { transform: translate(0, 0) scale(1); }
    25%  { transform: translate(80px, -40px) scale(1.05); }
    50%  { transform: translate(40px, 60px) scale(0.95); }
    75%  { transform: translate(-60px, 20px) scale(1.08); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes drift2 {
    0%   { transform: translate(0, 0) scale(1.05); }
    25%  { transform: translate(-70px, 50px) scale(1); }
    50%  { transform: translate(50px, -30px) scale(1.1); }
    75%  { transform: translate(30px, 70px) scale(0.95); }
    100% { transform: translate(0, 0) scale(1.05); }
  }
  @keyframes drift3 {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(-40px, -60px) scale(1.1); }
    66%  { transform: translate(60px, 40px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes gridScroll {
    0%   { background-position: 0 0, 0 0; }
    100% { background-position: 0 60px, 60px 0; }
  }
`;

const styles: Record<string, CSSProperties> = {
  shell: {
    position: 'relative',
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    overflow: 'hidden',
    background: '#020206',
  } as CSSProperties,

  baseBg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    background: `
      radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6,10,30,1) 0%, #020206 100%)
    `,
    pointerEvents: 'none',
  },

  /* ============ ORBS — very visible ============ */
  orb1: {
    position: 'fixed',
    top: '-5%',
    left: '15%',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,153,249,0.35) 0%, rgba(0,100,220,0.12) 40%, transparent 70%)',
    filter: 'blur(60px)',
    zIndex: 0,
    animation: 'drift1 20s ease-in-out infinite',
    pointerEvents: 'none',
  },

  orb2: {
    position: 'fixed',
    bottom: '-10%',
    right: '10%',
    width: 550,
    height: 550,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(120,40,220,0.30) 0%, rgba(80,20,180,0.10) 40%, transparent 70%)',
    filter: 'blur(50px)',
    zIndex: 0,
    animation: 'drift2 25s ease-in-out infinite',
    pointerEvents: 'none',
  },

  orb3: {
    position: 'fixed',
    top: '50%',
    right: '35%',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,180,0.18) 0%, transparent 60%)',
    filter: 'blur(50px)',
    zIndex: 0,
    animation: 'drift3 18s ease-in-out infinite',
    pointerEvents: 'none',
  },

  /* ============ GRID — clearly visible ============ */
  gridWrap: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    perspective: 800,
    perspectiveOrigin: '50% 30%',
  },

  grid: {
    position: 'absolute',
    top: '30%',
    left: '-20%',
    width: '140%',
    height: '120%',
    backgroundImage: `
      linear-gradient(rgba(0,153,249,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,153,249,0.08) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    transform: 'rotateX(55deg)',
    transformOrigin: '50% 0%',
    animation: 'gridScroll 4s linear infinite',
    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.8) 50%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.8) 50%, transparent 100%)',
  },

  gridFade: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #020206 85%)',
  },

  noise: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    opacity: 0.35,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
  },

  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
};
