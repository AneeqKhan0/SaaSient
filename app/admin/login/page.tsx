'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { AuthForm } from '@/app/components/auth/AuthForm';
import { Input } from '@/app/components/shared/Input';
import { PasswordInput } from '@/app/components/auth/PasswordInput';
import { Button } from '@/app/components/shared/Button';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/admin/onboard-customer');
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simple authentication - no company check
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    setLoading(false);
    router.replace('/admin/onboard-customer');
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Admin Login"
            subtitle="Sign in to access admin functions"
            badge="Admin Portal"
            onSubmit={onSubmit}
            message={message}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                Admin access only. This bypasses company membership checks.
              </p>
            }
          >
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="admin@company.com"
              autoComplete="email"
              required
              onFocus={() => setSuspendGlow(true)}
              onBlur={() => setSuspendGlow(false)}
            />

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

            <div
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Signing in…' : 'Sign in as Admin'}
              </Button>
            </div>
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}
