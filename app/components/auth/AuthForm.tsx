import { CSSProperties, ReactNode } from 'react';
import { colors, spacing } from '../shared/constants';
import { Badge } from '../shared/Badge';

type AuthFormProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  message?: string | null;
  messageType?: 'error' | 'success';
  footer?: ReactNode;
};

export function AuthForm({ title, subtitle, badge, onSubmit, children, message, messageType = 'error', footer }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {badge && (
        <div style={styles.badgeRow}>
          <Badge>{badge}</Badge>
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>

      {message && (
        <div style={{ ...styles.message, ...(messageType === 'success' ? styles.messageSuccess : styles.messageError) }}>
          {message}
        </div>
      )}

      <div style={styles.fields}>{children}</div>

      {footer && <div style={styles.footer}>{footer}</div>}
    </form>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    padding: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
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
  message: {
    padding: spacing.sm,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  messageError: {
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
  },
  messageSuccess: {
    background: 'rgba(34,197,94,0.15)',
    color: '#22c55e',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.text.secondary,
  },
};
