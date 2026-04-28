import { CSSProperties } from 'react';
import { colors } from '../shared/constants';

type SuccessModalProps = {
  companyName: string;
  email: string;
  companyId: string;
  onClose: () => void;
};

export function SuccessModal({ companyName, email, companyId, onClose }: SuccessModalProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <div style={styles.icon}>✅</div>
        <div style={styles.message}>Customer account created successfully!</div>
        <div style={styles.details}>
          <div><strong>Company:</strong> {companyName}</div>
          <div><strong>Email:</strong> {email}</div>
          <div><strong>ID:</strong> {companyId}</div>
        </div>
        <button style={styles.button} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    background: 'rgba(12,18,32,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 32,
    maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 40px 140px rgba(0,0,0,0.75)',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text.primary,
    marginBottom: 12,
  },
  details: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },
  button: {
    padding: '12px 24px',
    background: 'rgba(0,153,249,0.15)',
    border: '1px solid rgba(0,153,249,0.35)',
    borderRadius: 12,
    color: '#0099f9',
    fontSize: 14,
    fontWeight: 850,
    cursor: 'pointer',
    width: '100%',
  },
};
