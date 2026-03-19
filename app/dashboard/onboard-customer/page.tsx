'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/app/components/shared/Input';
import { Button } from '@/app/components/shared/Button';
import { PasswordInput } from '@/app/components/auth/PasswordInput';
import { Select } from '@/app/components/admin/Select';
import { SuccessModal } from '@/app/components/admin/SuccessModal';
import { colors, borderRadius, spacing } from '@/app/components/shared/constants';

type FormData = {
  companyName: string;
  email: string;
  password: string;
  plan: string;
  phone: string;
  maxLeads: string;
};

type SuccessData = {
  companyId: string;
  companyName: string;
  email: string;
};

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export default function OnboardCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    email: '',
    password: '',
    plan: 'starter',
    phone: '',
    maxLeads: '',
  });

  // Check if user is authenticated (basic check - you may want to add admin role check)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    })();
  }, [router]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.companyName.trim()) {
      return 'Company name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Invalid email format';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!formData.maxLeads.trim()) {
      return 'Max leads is required';
    }
    const maxLeadsNum = parseInt(formData.maxLeads);
    if (isNaN(maxLeadsNum) || maxLeadsNum < 1) {
      return 'Max leads must be a valid number greater than 0';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboard-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to onboard customer');
      }

      // Show success modal
      setSuccessData({
        companyId: result.data.companyId,
        companyName: result.data.companyName,
        email: result.data.email,
      });

      // Reset form
      setFormData({
        companyName: '',
        email: '',
        password: '',
        plan: 'starter',
        phone: '',
        maxLeads: '',
      });

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to onboard customer');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessData(null);
  };

  if (checkingAuth) {
    return (
      <div style={styles.shell}>
        <div style={styles.bg} aria-hidden="true" />
        <div style={styles.noise} aria-hidden="true" />
        <div style={styles.container}>
          <div style={styles.loadingText}>Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.shell}>
        <div style={styles.bg} aria-hidden="true" />
        <div style={styles.noise} aria-hidden="true" />

        <div style={styles.container}>
          <div style={styles.header}>
            <button onClick={() => router.back()} style={styles.backButton}>
              ← Back
            </button>
            <h1 style={styles.title}>Onboard New Customer</h1>
            <p style={styles.subtitle}>
              Create a new company account and owner user
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Company Information</h2>
              </div>

              <div style={styles.cardBody}>
                <Input
                  id="companyName"
                  type="text"
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(value) => updateField('companyName', value)}
                  placeholder="Acme Corporation"
                  required
                />

                <Select
                  id="plan"
                  label="Plan"
                  value={formData.plan}
                  onChange={(value) => updateField('plan', value)}
                  options={PLAN_OPTIONS}
                  required
                />

                <Input
                  id="phone"
                  type="tel"
                  label="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={(value) => updateField('phone', value)}
                  placeholder="+1 (555) 123-4567"
                />

                <Input
                  id="maxLeads"
                  type="number"
                  label="Max Leads"
                  value={formData.maxLeads}
                  onChange={(value) => updateField('maxLeads', value)}
                  placeholder="Enter max leads limit"
                  required
                />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Owner Account</h2>
                <p style={styles.cardDescription}>
                  This user will be the company owner with full access
                </p>
              </div>

              <div style={styles.cardBody}>
                <Input
                  id="email"
                  type="email"
                  label="Contact Email"
                  value={formData.email}
                  onChange={(value) => updateField('email', value)}
                  placeholder="owner@company.com"
                  autoComplete="email"
                  required
                />

                <PasswordInput
                  id="password"
                  label="Password"
                  value={formData.password}
                  onChange={(value) => updateField('password', value)}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                />

                <div style={styles.passwordHint}>
                  Password must be at least 8 characters long
                </div>
              </div>
            </div>

            {error && (
              <div style={styles.errorAlert}>
                <span style={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div style={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Creating Account...' : 'Create Customer Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {successData && (
        <SuccessModal
          companyName={successData.companyName}
          email={successData.email}
          companyId={successData.companyId}
          onClose={handleCloseSuccess}
        />
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .onboardContainer {
            padding: 20px !important;
          }
          .onboardForm {
            gap: 16px !important;
          }
          .onboardCard {
            padding: 16px !important;
          }
          .onboardActions {
            flex-direction: column !important;
          }
          .onboardActions button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#060606',
    position: 'relative',
    overflow: 'auto',
  },
  bg: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(circle at 50% 0%, rgba(0,153,249,0.12), transparent 50%)',
    pointerEvents: 'none',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
    opacity: 0.4,
    pointerEvents: 'none',
  },
  container: {
    position: 'relative',
    maxWidth: 800,
    margin: '0 auto',
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.sm,
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: 700,
    padding: '10px 16px',
    cursor: 'pointer',
    marginBottom: spacing.lg,
    transition: 'all 0.2s',
  },
  title: {
    fontSize: 32,
    fontWeight: 950,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text.secondary,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  card: {
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.xl,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.20)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text.secondary,
    margin: 0,
    marginTop: 6,
  },
  cardBody: {
    padding: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  passwordHint: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text.tertiary,
    marginTop: -8,
  },
  errorAlert: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 18,
  },
  actions: {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: colors.text.secondary,
    padding: spacing.xl,
  },
};
