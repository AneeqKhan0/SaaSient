'use client';

import { CSSProperties, ReactNode } from 'react';
import { useCardGlow } from './useCardGlow';
import { colors, borderRadius, ACCENT } from '../shared/constants';

type GlowCardProps = {
  children: ReactNode | ((setSuspendGlow: (suspend: boolean) => void) => ReactNode);
  onSuspendGlow?: (suspend: boolean) => void;
};

export function GlowCard({ children, onSuspendGlow }: GlowCardProps) {
  const { cardRef, hovered, pos, setSuspendGlow } = useCardGlow();

  const handleSuspendGlow = (suspend: boolean) => {
    setSuspendGlow(suspend);
    onSuspendGlow?.(suspend);
  };

  return (
    <div ref={cardRef} style={styles.card} className="glowCard">
      <style>{keyframes}</style>
      <style jsx global>{`
        @media (max-width: 640px) {
          .glowCard {
            max-width: 100% !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      {/* Subtle animated background gradient/noise */}
      <div style={styles.baseBg} aria-hidden="true" />

      {hovered && (
        <div
          style={{
            ...styles.glow,
            left: pos.x,
            top: pos.y,
          }}
          aria-hidden="true"
        />
      )}

      <div style={styles.content}>{typeof children === 'function' ? children(handleSuspendGlow) : children}</div>
    </div>
  );
}

const keyframes = `
  @keyframes bgFloat {
    0%, 100% { transform: translate(0, 0) scale(1.0); }
    33% { transform: translate(25px, -15px) scale(1.05); }
    66% { transform: translate(-15px, 20px) scale(1.0); }
  }
  @keyframes subtlePulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.25; }
  }
`;

const styles: Record<string, CSSProperties> = {
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 440,
    borderRadius: borderRadius.xxl,
    background: 'rgba(5, 7, 10, 0.65)', // Slightly more transparent base
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${colors.card.border}`,
    overflow: 'hidden',
    boxShadow: '0 40px 100px -12px rgba(0,0,0,0.6)', // Deeper shadow for elevation
  },

  // New base background texture to avoid "empty" look
  baseBg: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    background: `
      radial-gradient(800px circle at top center, rgba(0,153,249,0.03), transparent 40%),
      radial-gradient(600px circle at bottom right, rgba(255,255,255,0.02), transparent 40%)
    `,
    opacity: 0.8,
  },

  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    marginLeft: -140,
    marginTop: -140,
    // Smooth, soft gradient
    background: `radial-gradient(circle, ${ACCENT}25 0%, ${ACCENT}00 65%, transparent 70%)`,
    pointerEvents: 'none',
    zIndex: 1,
    transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)', // Smoother fade in/out
    animation: 'bgFloat 10s ease-in-out infinite', // Slower, more subtle float
    mixBlendMode: 'screen', // Blends nicely with dark background
  },

  content: {
    position: 'relative',
    zIndex: 2,
    // Add a very subtle noise texture overlay if desired, but kept simple for now
  },
};
