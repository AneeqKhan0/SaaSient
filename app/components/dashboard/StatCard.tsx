import { CSSProperties, ReactNode } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type StatCardProps = {
  icon?: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
};

export function StatCard({ icon, title, value, subtitle, onClick }: StatCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      style={{
        ...styles.card,
        cursor: isClickable ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {icon && <div style={styles.icon}>{icon}</div>}
      <div style={styles.content}>
        <div style={styles.title}>{title}</div>
        <div style={styles.value}>{value}</div>
        {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    background: colors.card.background,
    border: `1px solid ${colors.card.border}`,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    transition: 'transform 160ms ease, box-shadow 160ms ease',
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: 900,
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text.tertiary,
    marginTop: 4,
  },
};
