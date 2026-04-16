'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Wait a bit for cookie to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use window.location for a hard redirect to ensure cookie is sent
      window.location.href = '/admin/dashboard';
    } catch (error: any) {
      setMessage(error.message || 'Login failed');
      setLoading(false);
    }
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
