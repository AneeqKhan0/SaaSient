'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { AuthForm } from '@/app/components/auth/AuthForm';
import { Input } from '@/app/components/shared/Input';
import { Button } from '@/app/components/shared/Button';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/dashboard');
    })();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessage('If that email exists, we have sent a password reset link.');
    } catch (err: any) {
      setMessage(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Reset password"
            subtitle="Enter your email and we will send you a secure reset link."
            badge="SaaSient Dashboard"
            onSubmit={onSubmit}
            message={message}
            messageType={message?.includes('have sent') ? 'success' : 'error'}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                Tip: Check your spam/junk folder if you don't see the email within a minute.
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

            <div
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button type="button" variant="secondary">
                  Back to login
                </Button>
              </Link>
            </div>
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}
