import { ReactNode } from 'react';
import { colors, borderRadius, spacing } from '../shared/constants';

type DetailPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function DetailPanel({ title, subtitle, children }: DetailPanelProps) {
  return (
    <>
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.title}>{title}</div>
          {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div style={styles.body}>{children}</div>
    </>
  );
}

const styles = {
  header: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.12)',
    flex: '0 0 auto',
  },
  title: {
    fontSize: 16,
    fontWeight: 980,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text.secondary,
  },
  body: {
    padding: spacing.md,
    overflow: 'auto',
    minHeight: 0,
    flex: '1 1 auto',
  },
};