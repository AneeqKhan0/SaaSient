import { colors, borderRadius, spacing } from '../shared/constants';

type LeadItemProps = {
  title: string;
  badge: string;
  score: string;
  timestamp?: string;
  active: boolean;
  onClick: () => void;
};

export function LeadItem({ title, badge, score, timestamp, active, onClick }: LeadItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.item,
        ...(active ? styles.itemActive : {}),
      }}
      title={title}
    >
      <div style={styles.top}>
        <div style={styles.title}>{title}</div>
        <div style={styles.scorePill}>
          <span style={styles.scoreDot} />
          <span style={{ fontWeight: 950 }}>{score}</span>
        </div>
      </div>

      <div style={styles.bottom}>
        <div style={styles.badge}>{badge}</div>
        <div style={styles.timestamp}>{timestamp || '—'}</div>
      </div>
    </button>
  );
}

const styles = {
  item: {
    textAlign: 'left' as const,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.18)',
    color: colors.text.primary,
    cursor: 'pointer',
    width: '100%',
  },
  itemActive: {
    border: `1px solid ${colors.card.borderAccent}`,
    boxShadow: '0 0 0 1px rgba(0,153,249,0.18), 0 14px 45px rgba(0,0,0,0.35)',
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontWeight: 980,
    fontSize: 14,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  scorePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: '6px 10px',
    borderRadius: 999,
    border: `1px solid ${colors.card.border}`,
    background: colors.card.background,
    flex: '0 0 auto',
  },
  scoreDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: colors.accent,
    boxShadow: `0 0 0 6px rgba(0,153,249,0.12)`,
  },
  bottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  badge: {
    fontSize: 12,
    fontWeight: 950,
    padding: '6px 10px',
    borderRadius: 999,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.18)',
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
    whiteSpace: 'nowrap' as const,
  },
};