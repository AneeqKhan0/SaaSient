import { colors, borderRadius, spacing } from '../shared/constants';

type KeyValueGridProps = {
  data: Record<string, any>;
  columns?: string[];
  fontSize?: number;
  searchQuery?: string;
};

export function KeyValueGrid({ data, columns, fontSize = 13, searchQuery = '' }: KeyValueGridProps) {
  const keysToShow = columns || Object.keys(data);
  const q = searchQuery.trim().toLowerCase();

  const filteredKeys = q
    ? keysToShow.filter((key) => {
        const val = formatValue(data[key]).toLowerCase();
        return key.toLowerCase().includes(q) || val.includes(q);
      })
    : keysToShow;

  if (filteredKeys.length === 0 && q) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
        No fields match &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {filteredKeys.map((key) => (
        <KeyValueItem key={key} label={key} value={data[key]} fontSize={fontSize} highlight={q} />
      ))}
    </div>
  );
}

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: 'rgba(255,220,0,0.50)',
              color: '#000',
              borderRadius: 3,
              padding: '0 2px',
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function KeyValueItem({
  label,
  value,
  fontSize = 13,
  highlight: highlightQuery = '',
}: {
  label: string;
  value: any;
  fontSize?: number;
  highlight?: string;
}) {
  const str = formatValue(value);
  const isLong = str.length > 140;

  return (
    <div style={styles.item}>
      <div style={styles.label}>{highlight(label, highlightQuery)}</div>
      <div
        style={{
          ...styles.value,
          fontSize,
          ...(isLong ? styles.valueLong : {}),
        }}
        title={isLong ? str : undefined}
      >
        {str ? highlight(str, highlightQuery) : '—'}
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
