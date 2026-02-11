'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { AuthForm } from '@/app/components/auth/AuthForm';
import { Input } from '@/app/components/shared/Input';
import { PasswordInput } from '@/app/components/auth/PasswordInput';
import { Button } from '@/app/components/shared/Button';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === 'aal2') router.replace('/auth/mfa');
      else router.replace('/dashboard');
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const { data: aal, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setLoading(false);

    if (aalErr) {
      setMessage(aalErr.message);
      return;
    }

    if (aal?.nextLevel === 'aal2') {
      router.replace('/auth/mfa');
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Sign in"
            subtitle="Enter your email and password to sign in."
            badge="SaaSient Dashboard"
            onSubmit={onSubmit}
            message={message}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                If you don&apos;t have a user yet, create one in Supabase → Authentication → Users.
              </p>
            }
          >
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email"
              required
              onFocus={() => setSuspendGlow(true)}
              onBlur={() => setSuspendGlow(false)}
            />

            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                onFocus={() => setSuspendGlow(true)}
                onBlur={() => setSuspendGlow(false)}
                autoComplete="current-password"
              />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.65)',
                    textDecoration: 'none',
                    padding: '4px 6px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <a href="mailto:support@saasient.com" style={{ textDecoration: 'none' }}>
                <Button type="button" variant="secondary">
                  Contact Support
                </Button>
              </a>
            </div>
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}
