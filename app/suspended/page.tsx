'use client';

import { CSSProperties } from 'react';
import { colors } from '@/app/components/shared/constants';

export default function SuspendedPage() {
  return (
    <div style={styles.shell}>
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.noise} aria-hidden="true" />
      
      <div style={styles.content}>
        <div style={styles.icon}>🚫</div>
        <div style={styles.title}>Account Suspended</div>
        <div style={styles.message}>
          Your company account has been temporarily suspended. 
          Please contact support for more information.
        </div>
        <a href="mailto:support@saasient.com" style={styles.button}>
          Contact Support
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #060606, #050505)',
    color: '#fff',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  bg: {
    position: 'absolute',
    inset: '-20%',
    pointerEvents: 'none',
    background: `
      radial-gradient(560px 380px at 50% 50%, rgba(239,68,68,0.16), transparent 66%)
    `,
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
  content: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: 500,
    padding: 40,
    background: 'rgba(12,18,32,0.85)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 24,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 40px 140px rgba(0,0,0,0.75)',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 1.6,
    marginBottom: 32,
  },
  button: {
    display: 'inline-block',
    padding: '14px 28px',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.35)',
    borderRadius: 12,
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: 850,
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
};
