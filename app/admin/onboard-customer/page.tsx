'use client';

import { CSSProperties, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    email: '',
    password: '',
    plan: 'starter',
    phone: '',
  });

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

  return (
    <>
      <div style={styles.shell}>
        <div style={styles.noise} aria-hidden="true" />

        <div style={styles.container}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formCard}>
              <div style={styles.formBody}>
                {/* Header inside card */}
                <div style={styles.badgeRow}>
                  <div style={styles.badge}>Admin Portal</div>
                </div>
                
                <div style={styles.header}>
                  <h1 style={styles.title}>Onboard New Customer</h1>
                  <p style={styles.subtitle}>
                    Create a new company account with owner credentials
                  </p>
                </div>

                {/* Company Name & Plan Row */}
                <div style={styles.row}>
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
                </div>

                {/* Email & Phone Row */}
                <div style={styles.row}>
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
                  <Input
                    id="phone"
                    type="tel"
                    label="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Password */}
                <PasswordInput
                  id="password"
                  label="Password"
                  value={formData.password}
                  onChange={(value) => updateField('password', value)}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                />

                <div style={styles.hint}>
                  Password must be at least 8 characters long
                </div>

                {/* Error Message */}
                {error && (
                  <div style={styles.errorAlert}>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div style={styles.buttonRow}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => window.location.href = '/login'}
                    style={styles.backButton}
                  >
                    Back to Login
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    style={styles.submitButton}
                  >
                    {loading ? 'Creating Account...' : 'Create Customer Account'}
                  </Button>
                </div>
              </div>
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
          .onboard-row {
            grid-template-columns: 1fr !important;
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
    padding: '40px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noise: {
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
    opacity: 0.4,
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    position: 'relative',
    zIndex: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formCard: {
    background: 'rgba(18,24,38,0.85)',
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.xl,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  formBody: {
    padding: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    color: colors.accent,
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text.secondary,
    margin: 0,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
  },
  hint: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text.tertiary,
    padding: '12px 16px',
    background: 'rgba(0,153,249,0.08)',
    border: `1px solid rgba(0,153,249,0.2)`,
    borderRadius: borderRadius.sm,
    marginTop: -8,
  },
  errorAlert: {
    padding: spacing.sm,
    borderRadius: 12,
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: spacing.sm,
    alignItems: 'center',
  },
  backButton: {
    height: 48,
    fontSize: 15,
    fontWeight: 900,
    flex: '0 0 auto',
    minWidth: 140,
  },
  submitButton: {
    height: 48,
    fontSize: 15,
    fontWeight: 900,
    flex: 1,
  },
};