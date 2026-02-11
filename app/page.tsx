'use client';

import React from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { Badge } from '@/app/components/shared/Badge';
import { Button } from '@/app/components/shared/Button';
import { colors } from '@/app/components/shared/constants';

export default function HomePage() {
  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <div style={styles.inner}>
            <Badge>SaaSient Dashboard</Badge>

            <h1 style={styles.h1}>Lead &amp; Conversation Hub</h1>

            <p style={styles.sub}>
              Secure access to your WhatsApp + Voice leads, real-time conversations, and performance metrics.
            </p>

            <div
              style={styles.btnRow}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="primary">Login</Button>
              </Link>
              <a href="mailto:support@saasient.ai" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">Contact Support</Button>
              </a>
            </div>
          </div>
        )}
      </GlowCard>
    </AuthLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inner: {
    padding: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  h1: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: 900,
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 10,
    color: colors.text.secondary,
    maxWidth: 500,
    fontSize: 14,
    lineHeight: 1.6,
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};
