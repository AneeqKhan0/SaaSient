import { colors, borderRadius, spacing } from '../shared/constants';

type KeyValueGridProps = {
  data: Record<string, any>;
  columns?: string[];
};

export function KeyValueGrid({ data, columns }: KeyValueGridProps) {
  const keysToShow = columns || Object.keys(data);

  return (
    <div style={styles.grid}>
      {keysToShow.map((key) => (
        <KeyValueItem key={key} label={key} value={data[key]} />
      ))}
    </div>
  );
}

function KeyValueItem({ label, value }: { label: string; value: any }) {
  const str = formatValue(value);
  const isLong = str.length > 140;

  return (
    <div style={styles.item}>
      <div style={styles.label}>{label}</div>
      <div
        style={{
          ...styles.value,
          ...(isLong ? styles.valueLong : {}),
        }}
        title={isLong ? str : undefined}
      >
        {str || '—'}
      </div>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: spacing.sm,
  },
  item: {
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.card.border}`,
    background: 'rgba(0,0,0,0.18)',
    padding: spacing.sm,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 950,
    color: colors.text.secondary,
  },
  value: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
  },
  valueLong: {
    whiteSpace: 'pre-wrap' as const,
  },
};