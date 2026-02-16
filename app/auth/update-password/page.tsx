'use client';

import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { isValidPassword } from '@/lib/security';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { AuthForm } from '@/app/components/auth/AuthForm';
import { PasswordInput } from '@/app/components/auth/PasswordInput';
import { Button } from '@/app/components/shared/Button';

function UpdatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get('code'), [searchParams]);
  const tokenHash = useMemo(() => searchParams.get('token_hash'), [searchParams]);
  const type = useMemo(() => searchParams.get('type'), [searchParams]);

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMessage(null);

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) setReady(true);
          return;
        }

        if (tokenHash && (type === 'recovery' || !type)) {
          const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
          if (error) throw error;
          if (!cancelled) setReady(true);
          return;
        }

        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        if (hash && hash.startsWith('#')) {
          const hashParams = new URLSearchParams(hash.slice(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            if (!cancelled) setReady(true);
            return;
          }
        }

        setMessage('Invalid or missing recovery link. Please request a new one.');
      } catch (err: any) {
        if (!cancelled) {
          setMessage(err?.message ?? 'Could not validate recovery link. Please try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, tokenHash, type]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Validate password
    const passwordValidation = isValidPassword(pw1);
    if (!passwordValidation.valid) {
      setMessage(passwordValidation.message || 'Invalid password');
      return;
    }

    if (pw1 !== pw2) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMessage('Password updated successfully. Redirecting to login…');
      setTimeout(() => router.replace('/login'), 800);
    } catch (err: any) {
      setMessage(err?.message ?? 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow) => (
          <AuthForm
            title="Set a new password"
            subtitle="Choose a strong password you'll remember."
            badge="SaaSient Dashboard"
            onSubmit={onSubmit}
            message={message}
            messageType={message?.includes('successfully') ? 'success' : 'error'}
            footer={
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                If this link is expired, go back and request a new reset email.
              </p>
            }
          >
            {!ready ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.80)', padding: '20px 0' }}>
                {message ?? 'Validating recovery link…'}
              </p>
            ) : (
              <>
                <PasswordInput
                  id="pw1"
                  label="New password"
                  value={pw1}
                  onChange={setPw1}
                  show={showPw1}
                  onToggleShow={() => setShowPw1((v) => !v)}
                  onFocus={() => setSuspendGlow(true)}
                  onBlur={() => setSuspendGlow(false)}
                  autoComplete="new-password"
                />

                <PasswordInput
                  id="pw2"
                  label="Confirm password"
                  value={pw2}
                  onChange={setPw2}
                  show={showPw2}
                  onToggleShow={() => setShowPw2((v) => !v)}
                  onFocus={() => setSuspendGlow(true)}
                  onBlur={() => setSuspendGlow(false)}
                  autoComplete="new-password"
                />

                <div
                  style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
                  onPointerEnter={() => setSuspendGlow(true)}
                  onPointerLeave={() => setSuspendGlow(false)}
                >
                  <Button type="submit" disabled={loading} variant="primary">
                    {loading ? 'Updating…' : 'Update password'}
                  </Button>
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button type="button" variant="secondary">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <GlowCard>
          {() => (
            <AuthForm
              title="Set a new password"
              subtitle="Loading..."
              badge="SaaSient Dashboard"
              onSubmit={(e) => e.preventDefault()}
            >
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.80)', padding: '20px 0' }}>
                Loading...
              </p>
            </AuthForm>
          )}
        </GlowCard>
      </AuthLayout>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
}
