'use client';

import { CSSProperties, useState } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';
import { Button } from '../shared/Button';

type SuccessModalProps = {
  companyName: string;
  email: string;
  companyId: string;
  onClose: () => void;
};

export function SuccessModal({ companyName, email, companyId, onClose }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(companyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.title}>Customer Onboarded Successfully!</h2>
        </div>

        <div style={styles.body}>
          <div style={styles.infoSection}>
            <div style={styles.infoLabel}>Company Name</div>
            <div style={styles.infoValue}>{companyName}</div>
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoLabel}>Login Email</div>
            <div style={styles.infoValue}>{email}</div>
          </div>

          <div style={styles.companyIdSection}>
            <div style={styles.infoLabel}>Company ID (CRITICAL)</div>
            <div style={styles.companyIdBox}>
              <code style={styles.companyIdCode}>{companyId}</code>
              <button onClick={copyToClipboard} style={styles.copyButton}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div style={styles.stepsSection}>
            <div style={styles.stepsTitle}>Next Steps:</div>
            <ol style={styles.stepsList}>
              <li style={styles.stepItem}>
                Customer can now log in at their dashboard URL
              </li>
              <li style={styles.stepItem}>
                <strong>Copy the Company ID above</strong>
              </li>
              <li style={styles.stepItem}>
                Add it as <code style={styles.envCode}>NEXT_PUBLIC_COMPANY_ID</code> to their deployment environment
              </li>
              <li style={styles.stepItem}>
                Deploy their dashboard with this company_id
              </li>
              <li style={styles.stepItem}>
                Verify they can log in and see only their data
              </li>
            </ol>
          </div>
        </div>

        <div style={styles.footer}>
          <Button onClick={onClose} variant="primary" style={{ width: '100%' }}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.md,
  },
  modal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    background: 'rgba(18,24,38,0.98)',
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.card.borderAccent}`,
    boxShadow: '0 30px 120px rgba(0,153,249,0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: spacing.xl,
    borderBottom: `1px solid ${colors.card.border}`,
    textAlign: 'center',
    background: 'rgba(0,153,249,0.08)',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(34,197,94,0.15)',
    border: '2px solid #22c55e',
    color: '#22c55e',
    fontSize: 32,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 22,
    fontWeight: 950,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.3,
  },
  body: {
    padding: spacing.xl,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  infoSection: {
    padding: spacing.md,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.card.border}`,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text.primary,
  },
  companyIdSection: {
    padding: spacing.md,
    background: 'rgba(0,153,249,0.08)',
    borderRadius: borderRadius.sm,
    border: `2px solid ${colors.card.borderAccent}`,
  },
  companyIdBox: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  companyIdCode: {
    flex: 1,
    minWidth: 200,
    fontSize: 13,
    fontWeight: 700,
    color: colors.accent,
    background: 'rgba(0,0,0,0.35)',
    padding: '10px 12px',
    borderRadius: borderRadius.xs,
    border: `1px solid ${colors.card.border}`,
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  copyButton: {
    padding: '10px 16px',
    borderRadius: borderRadius.xs,
    border: `1px solid ${colors.card.borderAccent}`,
    background: colors.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  stepsSection: {
    padding: spacing.md,
    background: 'rgba(251,146,60,0.08)',
    borderRadius: borderRadius.sm,
    border: `1px solid rgba(251,146,60,0.25)`,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#fb923c',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsList: {
    margin: 0,
    paddingLeft: 20,
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 1.7,
  },
  stepItem: {
    marginBottom: 8,
    fontWeight: 600,
  },
  envCode: {
    background: 'rgba(0,0,0,0.35)',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.accent,
  },
  footer: {
    padding: spacing.lg,
    borderTop: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.20)',
  },
};
