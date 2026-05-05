'use client';

import { CSSProperties, ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { GlowCard } from '@/app/components/auth/GlowCard';
import { AuthForm } from '@/app/components/auth/AuthForm';
import { Button } from '@/app/components/shared/Button';
import { colors, borderRadius } from '@/app/components/shared/constants';

// MFA verified flag stored in localStorage with 7-day expiry per user
const MFA_STORAGE_KEY = 'mfa_verified_until';
const MFA_VALID_DAYS = 7;

// Pure helper — strips all non-digit characters from a string.
export function filterDigitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

function isMfaStillValid(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${MFA_STORAGE_KEY}_${userId}`);
    if (!raw) return false;
    return Date.now() < parseInt(raw, 10);
  } catch {
    return false;
  }
}

function setMfaVerified(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const expiresAt = Date.now() + MFA_VALID_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(`${MFA_STORAGE_KEY}_${userId}`, String(expiresAt));
  } catch { /* ignore */ }
}

export default function MfaPage() {
  const router = useRouter();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prevent double-send in React StrictMode
  const otpSentRef = useRef(false);

  // ─── Mount: session guard + 7-day check + send OTP ────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      // No session → go to login
      if (!data.session) {
        router.replace('/login');
        return;
      }

      const userId = data.session.user.id;

      // Already verified within 7 days → skip OTP
      if (isMfaStillValid(userId)) {
        router.replace('/dashboard');
        return;
      }

      // Get email — from sessionStorage (set by login page) or from session
      const storedEmail =
        (typeof window !== 'undefined' && sessionStorage.getItem('mfa_email')) ||
        data.session.user.email ||
        null;

      if (!storedEmail) {
        router.replace('/login');
        return;
      }

      if (!cancelled) setUserEmail(storedEmail);

      // Guard against double-send (React StrictMode)
      if (otpSentRef.current) return;
      otpSentRef.current = true;

      // Send OTP via Supabase
      try {
        const res = await fetch('/api/auth/mfa/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: storedEmail }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setMessage(body.error ?? 'Failed to send verification code. Please try again.');
          setMessageType('error');
        }
      } catch {
        if (!cancelled) {
          setMessage('Failed to send verification code. Please try again.');
          setMessageType('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // ─── OTP input ─────────────────────────────────────────────────────────────
  function handleOtpChange(e: ChangeEvent<HTMLInputElement>) {
    setOtp(filterDigitsOnly(e.target.value));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== 6 || !userEmail) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, token: otp }),
      });

      const body = await res.json();

      if (res.status === 400) {
        setMessage(body.error ?? 'Invalid code format.');
        setMessageType('error');
        return;
      }

      if (body.success === true) {
        // Get current session user id for 7-day flag
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setMfaVerified(sessionData.session.user.id);
        }
        // Clear the stored email
        sessionStorage.removeItem('mfa_email');
        router.replace('/dashboard');
      } else {
        setMessage(body.error ?? 'Invalid or expired code. Please try again.');
        setMessageType('error');
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  // ─── Resend ────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendDisabled || resendCooldown > 0 || !userEmail) return;

    setMessage(null);

    try {
      const res = await fetch('/api/auth/mfa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body.error ?? 'Failed to resend code. Please try again.');
        setMessageType('error');
        return;
      }

      // Start 60-second cooldown
      setResendCooldown(60);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setMessage('Failed to resend code. Please try again.');
      setMessageType('error');
    }
  }

  const resendLabel = resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code';
  const isResendDisabled = resendDisabled || resendCooldown > 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <GlowCard>
        {(setSuspendGlow: (suspend: boolean) => void) => (
          <AuthForm
            title="Verify your identity"
            subtitle="Enter the 6-digit code sent to your email."
            badge="SaaSient Dashboard"
            onSubmit={handleSubmit}
            message={message}
            messageType={messageType}
          >
            <div
              style={styles.otpWrapper}
              onFocus={() => setSuspendGlow(true)}
              onBlur={() => setSuspendGlow(false)}
            >
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                autoComplete="one-time-code"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                aria-label="6-digit verification code"
                style={styles.otpInput}
              />
            </div>

            <div
              style={styles.actions}
              onPointerEnter={() => setSuspendGlow(true)}
              onPointerLeave={() => setSuspendGlow(false)}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={loading || otp.length !== 6}
                style={styles.submitButton}
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={isResendDisabled}
                onClick={handleResend}
                style={styles.resendButton}
              >
                {resendLabel}
              </Button>
            </div>
          </AuthForm>
        )}
      </GlowCard>
    </AuthLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  otpWrapper: { display: 'flex', justifyContent: 'center' },
  otpInput: {
    width: '100%',
    height: 64,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.22)',
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: 8,
    textAlign: 'center',
    outline: 'none',
    caretColor: colors.accent,
  },
  actions: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' },
  submitButton: { width: '100%' },
  resendButton: { width: '100%' },
};
