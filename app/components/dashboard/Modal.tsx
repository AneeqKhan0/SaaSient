import { CSSProperties, ReactNode, useEffect } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.60)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1000,
    padding: spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    borderRadius: borderRadius.xxl,
    background: colors.card.background,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: `1px solid ${colors.card.border}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.card.border}`,
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    color: colors.text.primary,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    fontSize: 24,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  },
  content: {
    padding: spacing.lg,
    overflow: 'auto',
  },
};
