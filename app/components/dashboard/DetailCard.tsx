import { CSSProperties } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type DetailCardProps = {
  title: string;
  items: Array<{ label: string; value: string | number }>;
};

export function DetailCard({ title, items }: DetailCardProps) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.items}>
        {items.map((item, idx) => (
          <div key={idx} style={styles.row}>
            <span style={styles.label}>{item.label}</span>
            <span style={styles.value}>{item.value}</span>
          </div>
        ))}
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
  },
  title: {
    fontSize: 16,
    fontWeight: 900,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text.secondary,
  },
  value: {
    fontSize: 14,
    fontWeight: 750,
    color: colors.text.primary,
  },
};
