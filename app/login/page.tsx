'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { isValidEmail, sanitizeInput, RateLimiter } from '@/lib/security';
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
  const [rateLimiter] = useState(() => new RateLimiter(5, 60000)); // 5 attempts per minute

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      // If a session already exists at aal1, the user still needs to complete
      // email OTP verification — redirect to the MFA page, not the dashboard.
      router.replace('/auth/mfa');
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Check if COMPANY_ID is configured
    const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID;
    if (!COMPANY_ID) {
      setLoading(false);
      setMessage('Dashboard not configured. Contact support.');
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      setLoading(false);
      setMessage('Please enter a valid email address');
      return;
    }

    // Check rate limiting
    if (!rateLimiter.canAttempt(sanitizedEmail)) {
      setLoading(false);
      setMessage('Too many login attempts. Please wait a minute and try again.');
      return;
    }

    // Step 1: Authenticate user
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    // Step 2: CHECK IF USER BELONGS TO THIS COMPANY
    const { data: membership, error: memberError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', authData.user.id)
      .eq('company_id', COMPANY_ID)
      .single();

    if (memberError || !membership) {
      // User doesn't belong to this company - kick them out
      await supabase.auth.signOut();
      setLoading(false);
      setMessage('You do not have access to this dashboard. Please check your login URL.');
      return;
    }

    // Reset rate limiter on successful login
    rateLimiter.reset(sanitizedEmail);

    // Step 3: Store email for MFA page (needed for signInWithOtp)
    sessionStorage.setItem('mfa_email', sanitizedEmail);

    // Step 4: Always redirect to MFA verification after successful password auth.
    setLoading(false);
    router.replace('/auth/mfa');
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
