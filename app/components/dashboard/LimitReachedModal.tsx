'use client';

import { CSSProperties } from 'react';
import { Button } from '../shared/Button';
import { colors, borderRadius, spacing } from '../shared/constants';

type LimitReachedModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  if (!isOpen) return null;

  const handleContactSupport = () => {
    window.open('mailto:support@saasient.ai?subject=Plan Upgrade Request&body=Hello, I would like to upgrade my plan to get more leads. Please contact me to discuss options.', '_blank');
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        <div style={styles.content}>
          <div style={styles.icon}>⚠️</div>
          
          <h2 style={styles.title}>Plan Usage Limit Reached</h2>
          
          <p style={styles.message}>
            Your current plan usage is full. To continue adding more leads and qualify for additional features, 
            please contact our admin support team.
          </p>
          
          <div style={styles.actions}>
            <Button
              variant="primary"
              onClick={handleContactSupport}
              style={styles.contactButton}
            >
              <span style={styles.contactButtonText}>Contact Support</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    borderRadius: borderRadius.xl,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    zIndex: 1001,
    maxWidth: 480,
    width: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 1002,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 48, // Extra padding for close button
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text.secondary,
    lineHeight: 1.5,
    margin: 0,
    marginBottom: spacing.sm,
  },
  actions: {
    display: 'flex',
    width: '100%',
    marginTop: spacing.md,
  },
  contactButton: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: 900,
    minWidth: 0, // Allow button to shrink
  },
  contactButtonText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};